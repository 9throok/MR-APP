const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/auditLog');

// GET /api/doctor-requests — list doctor requests
// MRs see only their own; managers/admins see all
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const conditions = ['dr.org_id = $1'];
    const params = [req.org_id];

    // MRs can only see their own requests
    if (req.user.role === 'mr') {
      params.push(req.user.user_id);
      conditions.push(`dr.requested_by = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`dr.status = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows } = await db.query(
      `SELECT dr.*, u.name AS requester_name
       FROM doctor_requests dr
       LEFT JOIN users u ON dr.requested_by = u.user_id AND u.org_id = dr.org_id
       ${where}
       ORDER BY dr.created_at DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[DoctorRequests] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/doctor-requests/stats — pending count for managers
router.get('/stats', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT COUNT(*)::int AS pending FROM doctor_requests WHERE status = 'pending' AND org_id = $1`,
      [req.org_id]
    );
    res.json({ success: true, stats: rows[0] });
  } catch (err) {
    console.error('[DoctorRequests] Stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/doctor-requests — MR submits a new doctor request
router.post('/', async (req, res) => {
  try {
    const { name, specialty, tier, territory, preferred_visit_day, hospital, phone, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    // Default territory to the MR's own territory if not provided
    const effectiveTerritory = territory || req.user.territory || null;

    const { rows } = await db.query(
      `INSERT INTO doctor_requests (org_id, requested_by, name, specialty, tier, territory, preferred_visit_day, hospital, phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [req.org_id, req.user.user_id, name, specialty || null, tier || 'B', effectiveTerritory, preferred_visit_day || null, hospital || null, phone || null, notes || null]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[DoctorRequests] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/doctor-requests/:id/review — manager approves or rejects
router.patch('/:id/review', requireRole('manager', 'admin'), async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { status, review_notes } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Valid status required: approved, rejected' });
    }

    await client.query('BEGIN');

    // Update the request
    const { rows } = await client.query(
      `UPDATE doctor_requests
       SET status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4 AND org_id = $5 AND status = 'pending'
       RETURNING *`,
      [status, review_notes || null, req.user.user_id, id, req.org_id]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Request not found or already reviewed' });
    }

    const request = rows[0];

    // On approval, create the doctor profile (in the same org)
    if (status === 'approved') {
      await client.query(
        `INSERT INTO doctor_profiles (org_id, name, specialty, tier, territory, preferred_visit_day, hospital, phone, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [req.org_id, request.name, request.specialty, request.tier, request.territory, request.preferred_visit_day, request.hospital, request.phone, request.notes]
      );
    }

    await client.query('COMMIT');

    recordAudit({
      req,
      action: 'UPDATE',
      tableName: 'doctor_requests',
      rowId: request.id,
      after: { status: request.status, review_notes: request.review_notes, reviewed_by: request.reviewed_by },
      reason: `Doctor request ${status} by ${req.user.user_id}`,
    });

    res.json({ success: true, data: request });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[DoctorRequests] Review error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
