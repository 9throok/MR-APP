/**
 * routes/medical-queries.js — Phase C.2
 *
 * Doctor scientific queries → AI auto-drafts → medical_reviewer reviews →
 * sent to doctor.
 *
 * RBAC:
 *   - POST  (capture)   : mr / manager / admin
 *   - GET   (list)      : medical_reviewer / manager / admin (clinicians only)
 *   - PATCH (review)    : medical_reviewer / admin
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/auditLog');
const { draftAnswerForQuery } = require('../services/medicalQueryAnswer');

const VALID_STATUSES = ['open', 'in_review', 'answered', 'sent', 'closed_no_action'];
const VALID_CATEGORIES = ['efficacy', 'safety', 'dosing', 'interaction', 'off_label', 'clinical_data', 'administration', 'other'];
const VALID_URGENCY = ['low', 'standard', 'high', 'critical'];
const VALID_CAPTURED_VIA = ['mr_visit', 'phone', 'email', 'portal', 'event', 'other'];

// Reviewer-or-officer access for read/decision endpoints
const requireReviewerOrOfficer = requireRole('admin', 'manager', 'medical_reviewer');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/medical-queries — list with filters
// Query: ?status=&urgency=&category=&doctor_id=&reviewer_user_id=
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', requireReviewerOrOfficer, async (req, res) => {
  try {
    const { status, urgency, category, doctor_id, reviewer_user_id } = req.query;
    const params = [req.org_id];
    const where = ['org_id = $1'];

    if (status)            { params.push(status);            where.push(`status = $${params.length}`); }
    if (urgency)           { params.push(urgency);           where.push(`urgency = $${params.length}`); }
    if (category)          { params.push(category);          where.push(`category = $${params.length}`); }
    if (doctor_id)         { params.push(doctor_id);         where.push(`doctor_id = $${params.length}`); }
    if (reviewer_user_id)  { params.push(reviewer_user_id);  where.push(`reviewer_user_id = $${params.length}`); }

    const { rows } = await db.query(
      `SELECT * FROM medical_queries
       WHERE ${where.join(' AND ')}
       ORDER BY
         CASE urgency WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'standard' THEN 3 WHEN 'low' THEN 4 END,
         created_at DESC
       LIMIT 200`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[MedQ] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/medical-queries/stats — dashboard counters
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', requireReviewerOrOfficer, async (req, res) => {
  try {
    const { rows: byStatus } = await db.query(
      `SELECT status, COUNT(*)::int AS total
       FROM medical_queries
       WHERE org_id = $1
       GROUP BY status`,
      [req.org_id]
    );
    const { rows: byUrgency } = await db.query(
      `SELECT urgency, COUNT(*)::int AS total
       FROM medical_queries
       WHERE org_id = $1 AND status IN ('open','in_review')
       GROUP BY urgency`,
      [req.org_id]
    );
    res.json({ success: true, data: { byStatus, byUrgency } });
  } catch (err) {
    console.error('[MedQ] stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/medical-queries/:id — detail
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', requireReviewerOrOfficer, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT * FROM medical_queries WHERE id = $1 AND org_id = $2`,
      [id, req.org_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Query not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[MedQ] detail error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/medical-queries — capture a new query
// Body: { doctor_id?, doctor_name, question, captured_via?, product?, category?, urgency? }
//
// Triggers AI draft asynchronously (fire-and-forget).
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      doctor_id, doctor_name, question, captured_via,
      product, category, urgency,
    } = req.body;

    if (!doctor_name || !question) {
      return res.status(400).json({ error: 'doctor_name and question are required' });
    }
    if (captured_via && !VALID_CAPTURED_VIA.includes(captured_via)) {
      return res.status(400).json({ error: `captured_via must be one of: ${VALID_CAPTURED_VIA.join(', ')}` });
    }
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }
    if (urgency && !VALID_URGENCY.includes(urgency)) {
      return res.status(400).json({ error: `urgency must be one of: ${VALID_URGENCY.join(', ')}` });
    }
    if (doctor_id) {
      const { rowCount } = await db.query(
        `SELECT 1 FROM doctor_profiles WHERE id = $1 AND org_id = $2`,
        [doctor_id, req.org_id]
      );
      if (rowCount === 0) {
        return res.status(404).json({ error: 'doctor_id not found in this org' });
      }
    }

    const { rows } = await db.query(
      `INSERT INTO medical_queries
        (org_id, doctor_id, doctor_name, captured_by, captured_via,
         product, question, category, urgency)
       VALUES ($1, $2, $3, $4, COALESCE($5,'mr_visit'), $6, $7, $8, COALESCE($9,'standard'))
       RETURNING *`,
      [
        req.org_id,
        doctor_id || null, doctor_name, req.user.user_id,
        captured_via || null, product || null, question,
        category || null, urgency || null,
      ]
    );

    recordAudit({
      req,
      action: 'CREATE',
      tableName: 'medical_queries',
      rowId: rows[0].id,
      after: rows[0],
      reason: `Medical query captured for ${doctor_name}`,
    });

    // Fire-and-forget AI draft — do NOT block the user-facing response.
    draftAnswerForQuery(rows[0]).catch(err =>
      console.error('[MedQ] background draft error:', err.message)
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[MedQ] create error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/medical-queries/:id/redraft — re-trigger AI draft
// (Used after the reviewer adds context or the knowledge base is updated.)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/redraft', requireReviewerOrOfficer, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT * FROM medical_queries WHERE id = $1 AND org_id = $2`,
      [id, req.org_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Query not found' });
    }

    const result = await draftAnswerForQuery(rows[0]);
    if (!result) {
      return res.status(502).json({ error: 'AI draft failed; see server logs' });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[MedQ] redraft error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/medical-queries/:id — reviewer actions
// Body: { status?, final_answer?, final_citations?, send_method?, claim? }
//
// "claim": true → reviewer takes ownership; sets reviewer_user_id + flips
// status to 'in_review' if currently 'open'.
//
// Status transitions enforced:
//   open       → in_review | closed_no_action
//   in_review  → answered  | closed_no_action
//   answered   → sent      | in_review (reverted)
//   sent       → (terminal)
//   closed_no_action → (terminal)
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_TRANSITIONS = {
  open:             new Set(['in_review', 'closed_no_action']),
  in_review:        new Set(['answered', 'closed_no_action']),
  answered:         new Set(['sent', 'in_review']),
  sent:             new Set(),
  closed_no_action: new Set(),
};

router.patch('/:id', requireRole('admin', 'medical_reviewer'), async (req, res) => {
  const { id } = req.params;
  const { status, final_answer, final_citations, send_method, claim } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: before } = await client.query(
      `SELECT * FROM medical_queries WHERE id = $1 AND org_id = $2 FOR UPDATE`,
      [id, req.org_id]
    );
    if (before.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Query not found' });
    }
    const row = before[0];

    // Build the SET clause
    const fields = [];
    const params = [];
    let nextStatus = row.status;

    if (claim && row.status === 'open') {
      params.push('in_review');                  fields.push(`status = $${params.length}`);
      params.push(req.user.user_id);             fields.push(`reviewer_user_id = $${params.length}`);
      nextStatus = 'in_review';
    }

    if (status && status !== nextStatus) {
      if (!VALID_STATUSES.includes(status)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      }
      const allowed = ALLOWED_TRANSITIONS[row.status] || new Set();
      if (!allowed.has(status)) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: `Cannot transition from '${row.status}' to '${status}'. Allowed: ${[...allowed].join(', ') || '(none)'}`,
        });
      }
      params.push(status); fields.push(`status = $${params.length}`);
      nextStatus = status;
      // Stamp reviewer + reviewed_at when leaving open / entering answered
      if (!row.reviewer_user_id) {
        params.push(req.user.user_id); fields.push(`reviewer_user_id = $${params.length}`);
      }
      if (status === 'answered') {
        fields.push(`reviewed_at = NOW()`);
      }
      if (status === 'sent') {
        fields.push(`sent_at = NOW()`);
      }
    }

    if (final_answer !== undefined) {
      params.push(final_answer); fields.push(`final_answer = $${params.length}`);
    }
    if (final_citations !== undefined) {
      params.push(JSON.stringify(final_citations)); fields.push(`final_citations = $${params.length}`);
    }
    if (send_method !== undefined) {
      params.push(send_method); fields.push(`send_method = $${params.length}`);
    }

    if (fields.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No updatable fields supplied' });
    }

    params.push(id, req.org_id);
    const { rows: updated } = await client.query(
      `UPDATE medical_queries SET ${fields.join(', ')}
       WHERE id = $${params.length - 1} AND org_id = $${params.length}
       RETURNING *`,
      params
    );

    await client.query('COMMIT');

    recordAudit({
      req,
      action: 'UPDATE',
      tableName: 'medical_queries',
      rowId: id,
      before: {
        status: row.status,
        final_answer: row.final_answer,
        reviewer_user_id: row.reviewer_user_id,
      },
      after: {
        status: updated[0].status,
        final_answer: updated[0].final_answer,
        reviewer_user_id: updated[0].reviewer_user_id,
      },
      reason: `Medical query patched (status=${updated[0].status})`,
    });

    res.json({ success: true, data: updated[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[MedQ] patch error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
