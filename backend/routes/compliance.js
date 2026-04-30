/**
 * routes/compliance.js — Phase C.1
 *
 * Read + decision surface over `compliance_findings`. The AI Compliance
 * Watchdog (services/complianceWatchdog.js) writes findings; this route
 * lets the compliance officer triage them.
 *
 * Read access: admin, manager.
 * Decision access (acknowledge / dismiss / escalate / resolve): admin, manager.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/auditLog');

const VALID_STATUSES  = ['open', 'acknowledged', 'dismissed', 'escalated', 'resolved'];
const requireOfficer  = requireRole('admin', 'manager');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/compliance/findings — paginated list with filters
// Query: ?status=&severity=&finding_type=&user_id=&limit=&offset=
// ─────────────────────────────────────────────────────────────────────────────
router.get('/findings', requireOfficer, async (req, res) => {
  try {
    const { status, severity, finding_type, user_id } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const offset = parseInt(req.query.offset, 10) || 0;

    const params = [req.org_id];
    const where = ['org_id = $1'];

    if (status)       { params.push(status);       where.push(`status = $${params.length}`); }
    if (severity)     { params.push(severity);     where.push(`severity = $${params.length}`); }
    if (finding_type) { params.push(finding_type); where.push(`finding_type = $${params.length}`); }
    if (user_id)      { params.push(user_id);      where.push(`user_id = $${params.length}`); }

    params.push(limit);
    params.push(offset);

    const { rows } = await db.query(
      `SELECT * FROM compliance_findings
       WHERE ${where.join(' AND ')}
       ORDER BY
         CASE severity
           WHEN 'critical' THEN 1 WHEN 'high' THEN 2
           WHEN 'medium'   THEN 3 WHEN 'low'  THEN 4
         END,
         created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    console.error('[COMPLIANCE] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/compliance/stats — dashboard counters
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', requireOfficer, async (req, res) => {
  try {
    const { rows: byStatus } = await db.query(
      `SELECT status, COUNT(*)::int AS total
       FROM compliance_findings
       WHERE org_id = $1
       GROUP BY status`,
      [req.org_id]
    );

    const { rows: bySeverity } = await db.query(
      `SELECT severity, COUNT(*)::int AS total
       FROM compliance_findings
       WHERE org_id = $1 AND status = 'open'
       GROUP BY severity`,
      [req.org_id]
    );

    const { rows: byType } = await db.query(
      `SELECT finding_type, COUNT(*)::int AS total
       FROM compliance_findings
       WHERE org_id = $1 AND status = 'open'
       GROUP BY finding_type
       ORDER BY total DESC`,
      [req.org_id]
    );

    res.json({ success: true, data: { byStatus, bySeverity, byType } });
  } catch (err) {
    console.error('[COMPLIANCE] stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/compliance/findings/:id — decision
// Body: { status, review_notes? }
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/findings/:id', requireOfficer, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, review_notes } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const { rows: before } = await db.query(
      `SELECT * FROM compliance_findings WHERE id = $1 AND org_id = $2`,
      [id, req.org_id]
    );
    if (before.length === 0) {
      return res.status(404).json({ error: 'Finding not found' });
    }

    const { rows } = await db.query(
      `UPDATE compliance_findings
       SET status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4 AND org_id = $5
       RETURNING *`,
      [status, review_notes || null, req.user.user_id, id, req.org_id]
    );

    recordAudit({
      req,
      action: 'UPDATE',
      tableName: 'compliance_findings',
      rowId: id,
      before: before[0],
      after: rows[0],
      reason: `Compliance finding marked '${status}'`,
    });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[COMPLIANCE] decision error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
