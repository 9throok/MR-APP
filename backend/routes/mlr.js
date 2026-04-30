const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { recordAudit } = require('../middleware/auditLog');

const VALID_DECISIONS = ['approved', 'changes_requested', 'rejected'];

// Map a reviewer role string ('medical' / 'legal' / 'regulatory') to the
// corresponding users.role value that the caller must hold to act on a
// review row of that role. Admin is treated as a universal reviewer for
// emergency override (and is what the seed_content reviewer-rotation tests
// rely on).
const ROLE_TO_USER_ROLE = {
  medical: 'medical_reviewer',
  legal: 'legal_reviewer',
  regulatory: 'regulatory_reviewer'
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/mlr/stats — pending counts per reviewer role (admin/manager dashboard)
// MUST be defined before /:reviewId-style routes to avoid param capture.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT reviewer_role,
              COUNT(*) FILTER (WHERE decision = 'pending')::int           AS pending,
              COUNT(*) FILTER (WHERE decision = 'approved')::int          AS approved,
              COUNT(*) FILTER (WHERE decision = 'changes_requested')::int AS changes_requested,
              COUNT(*) FILTER (WHERE decision = 'rejected')::int          AS rejected
       FROM mlr_reviews
       WHERE org_id = $1
       GROUP BY reviewer_role
       ORDER BY reviewer_role`,
      [req.org_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[MLR] stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/mlr/queue — pending reviews for the caller's role
// MR-style: only see reviews matching one's own role. Admin sees everything.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/queue', async (req, res) => {
  try {
    const userRole = req.user.role;
    let roleFilter = '';
    const params = [req.org_id];

    if (userRole === 'medical_reviewer')          { params.push('medical');    roleFilter = `AND m.reviewer_role = $${params.length}`; }
    else if (userRole === 'legal_reviewer')        { params.push('legal');      roleFilter = `AND m.reviewer_role = $${params.length}`; }
    else if (userRole === 'regulatory_reviewer')   { params.push('regulatory'); roleFilter = `AND m.reviewer_role = $${params.length}`; }
    else if (userRole !== 'admin' && userRole !== 'manager') {
      // Other roles (mr, etc.) shouldn't see the queue at all.
      return res.status(403).json({ error: 'You do not have a reviewer role' });
    }

    const { rows } = await db.query(
      `SELECT m.id              AS review_id,
              m.reviewer_role,
              m.decision,
              m.decision_notes,
              m.reviewed_at,
              v.id              AS version_id,
              v.version_number,
              v.status          AS version_status,
              v.file_url,
              v.mime_type,
              v.submitted_at,
              v.ai_pre_review_notes,
              a.id              AS asset_id,
              a.title           AS asset_title,
              a.asset_type,
              a.therapeutic_area,
              p.name            AS product_name
       FROM mlr_reviews m
       JOIN content_versions v ON v.id = m.version_id AND v.org_id = m.org_id
       JOIN content_assets a   ON a.id = v.asset_id   AND a.org_id = v.org_id
       LEFT JOIN products p    ON p.id = a.product_id AND p.org_id = a.org_id
       WHERE m.org_id = $1
         AND m.decision = 'pending'
         AND v.status = 'in_review'
         ${roleFilter}
       ORDER BY v.submitted_at ASC, m.id ASC
       LIMIT 200`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[MLR] queue error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/mlr/reviews/:versionId — all 3 review rows + AI pre-review for a version
// Reviewer-readable; useful for the "see what the others said" pane.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/reviews/:versionId', async (req, res) => {
  try {
    const { versionId } = req.params;

    const { rows: vRows } = await db.query(
      `SELECT v.*, a.title AS asset_title, a.asset_type
       FROM content_versions v
       JOIN content_assets a ON a.id = v.asset_id AND a.org_id = v.org_id
       WHERE v.id = $1 AND v.org_id = $2`,
      [versionId, req.org_id]
    );
    if (vRows.length === 0) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const { rows: reviews } = await db.query(
      `SELECT m.*, u.name AS reviewer_name
       FROM mlr_reviews m
       LEFT JOIN users u ON u.user_id = m.reviewer_user_id AND u.org_id = m.org_id
       WHERE m.version_id = $1 AND m.org_id = $2
       ORDER BY m.reviewer_role`,
      [versionId, req.org_id]
    );

    const { rows: claims } = await db.query(
      `SELECT * FROM content_claims
       WHERE version_id = $1 AND org_id = $2
       ORDER BY id`,
      [versionId, req.org_id]
    );

    res.json({ success: true, data: { version: vRows[0], reviews, claims } });
  } catch (err) {
    console.error('[MLR] reviews lookup error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/mlr/reviews/:reviewId — submit a decision
// Body: { decision, decision_notes? }
//
// Caller must hold the matching reviewer role (or be admin).
// Transactional. After updating the row, recompute collective state:
//   - all 3 approved      → version → approved
//   - any one changes_req → version → changes_requested (other reviews stay
//                            wherever they are; submit endpoint resets on
//                            re-submission, so this isn't lost work)
//   - any one rejected    → version → changes_requested (treated identically
//                            to changes_requested for now; "rejected" is the
//                            same workflow signal but a stronger sentiment)
//   - otherwise           → version stays in_review (still waiting for the
//                            remaining roles)
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/reviews/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  const { decision, decision_notes } = req.body;

  if (!decision || !VALID_DECISIONS.includes(decision)) {
    return res.status(400).json({
      error: `decision must be one of: ${VALID_DECISIONS.join(', ')}`
    });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the review row + parent version
    const { rows: rRows } = await client.query(
      `SELECT m.*, v.status AS version_status, v.id AS v_id
       FROM mlr_reviews m
       JOIN content_versions v ON v.id = m.version_id AND v.org_id = m.org_id
       WHERE m.id = $1 AND m.org_id = $2
       FOR UPDATE OF m, v`,
      [reviewId, req.org_id]
    );
    if (rRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Review not found' });
    }
    const review = rRows[0];

    // Caller must have the matching reviewer role, or be admin.
    const expectedUserRole = ROLE_TO_USER_ROLE[review.reviewer_role];
    if (req.user.role !== 'admin' && req.user.role !== expectedUserRole) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: `You must have the ${expectedUserRole} role to act on this review`
      });
    }

    // Version must still be in_review for the decision to count.
    if (review.version_status !== 'in_review') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: `Cannot decide on this review: parent version is in status '${review.version_status}', not 'in_review'`
      });
    }

    // Update the review row
    const { rows: updated } = await client.query(
      `UPDATE mlr_reviews
       SET decision = $1, decision_notes = $2, reviewer_user_id = $3, reviewed_at = NOW()
       WHERE id = $4 AND org_id = $5
       RETURNING *`,
      [decision, decision_notes || null, req.user.user_id, reviewId, req.org_id]
    );

    // Compute collective state across all 3 reviews for this version
    const { rows: allReviews } = await client.query(
      `SELECT decision FROM mlr_reviews
       WHERE version_id = $1 AND org_id = $2`,
      [review.v_id, req.org_id]
    );
    const allApproved = allReviews.every(r => r.decision === 'approved');
    const anyChanges  = allReviews.some(r => r.decision === 'changes_requested' || r.decision === 'rejected');

    let newVersionStatus = null;
    if (allApproved) {
      newVersionStatus = 'approved';
    } else if (anyChanges) {
      newVersionStatus = 'changes_requested';
    }

    let updatedVersion = null;
    if (newVersionStatus) {
      const { rows: vUpdated } = await client.query(
        `UPDATE content_versions
         SET status = $1
         WHERE id = $2 AND org_id = $3
         RETURNING *`,
        [newVersionStatus, review.v_id, req.org_id]
      );
      updatedVersion = vUpdated[0];
    }

    await client.query('COMMIT');

    // Audit (regulated decision)
    recordAudit({
      req,
      action: 'UPDATE',
      tableName: 'mlr_reviews',
      rowId: updated[0].id,
      before: { decision: review.decision, decision_notes: review.decision_notes },
      after: { decision: updated[0].decision, decision_notes: updated[0].decision_notes },
      reason: `${review.reviewer_role} reviewer decided '${decision}'`,
    });
    if (newVersionStatus) {
      recordAudit({
        req,
        action: 'UPDATE',
        tableName: 'content_versions',
        rowId: review.v_id,
        before: { status: review.version_status },
        after: { status: newVersionStatus },
        reason: `Auto-flipped after MLR decision`,
      });
    }

    res.json({
      success: true,
      data: {
        review: updated[0],
        version_status_changed_to: newVersionStatus,
        version: updatedVersion
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[MLR] decision error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
