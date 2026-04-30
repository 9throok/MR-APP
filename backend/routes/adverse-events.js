const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');

// GET /api/adverse-events — list adverse events
router.get('/', async (req, res) => {
  try {
    const { status, severity, user_id } = req.query;
    const conditions = ['ae.org_id = $1'];
    const params = [req.org_id];

    if (status) {
      params.push(status);
      conditions.push(`ae.status = $${params.length}`);
    }
    if (severity) {
      params.push(severity);
      conditions.push(`ae.severity = $${params.length}`);
    }
    if (user_id) {
      params.push(user_id);
      conditions.push(`ae.user_id = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows } = await db.query(
      `SELECT ae.*, d.call_summary, d.doctor_feedback
       FROM adverse_events ae
       LEFT JOIN dcr d ON ae.dcr_id = d.id AND d.org_id = ae.org_id
       ${where}
       ORDER BY ae.detected_at DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[AE] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/adverse-events/stats — aggregate stats
router.get('/stats', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'confirmed')::int AS confirmed,
        COUNT(*) FILTER (WHERE status = 'dismissed')::int AS dismissed,
        COUNT(*) FILTER (WHERE status = 'reviewed')::int AS reviewed,
        COUNT(*) FILTER (WHERE severity = 'mild')::int AS mild,
        COUNT(*) FILTER (WHERE severity = 'moderate')::int AS moderate,
        COUNT(*) FILTER (WHERE severity = 'severe')::int AS severe,
        COUNT(*) FILTER (WHERE severity = 'critical')::int AS critical
      FROM adverse_events
      WHERE org_id = $1
    `, [req.org_id]);

    res.json({ success: true, stats: rows[0] });
  } catch (err) {
    console.error('[AE] Stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/adverse-events/:id/review — review an AE
router.patch('/:id/review', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, review_notes } = req.body;

    if (!status || !['confirmed', 'dismissed', 'reviewed'].includes(status)) {
      return res.status(400).json({ error: 'Valid status required: confirmed, dismissed, reviewed' });
    }

    const { rows } = await db.query(
      `UPDATE adverse_events
       SET status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4 AND org_id = $5
       RETURNING *`,
      [status, review_notes || null, req.user.user_id, id, req.org_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Adverse event not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[AE] Review error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
