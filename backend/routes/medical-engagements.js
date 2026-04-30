/**
 * routes/medical-engagements.js — Phase C.2
 *
 * Advisory boards, speaker programs, symposia, consultations.
 * Manages the engagement record + attendee roster.
 *
 * RBAC:
 *   - Read: medical_reviewer / manager / admin
 *   - Write: manager / admin
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/auditLog');

const VALID_TYPES = ['advisory_board', 'speaker_program', 'symposium', 'consultation', 'investigator_meeting', 'roundtable', 'other'];
const VALID_STATUSES = ['planned', 'confirmed', 'completed', 'cancelled'];
const VALID_ATTENDEE_ROLES = ['attendee', 'speaker', 'chair', 'panelist', 'organiser'];

const requireRead = requireRole('admin', 'manager', 'medical_reviewer');
const requireWrite = requireRole('admin', 'manager');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/medical-engagements — list with filters
// Query: ?type=&status=&from=&to=
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', requireRead, async (req, res) => {
  try {
    const { type, status, from, to } = req.query;
    const params = [req.org_id];
    const where = ['org_id = $1'];

    if (type)   { params.push(type);   where.push(`engagement_type = $${params.length}`); }
    if (status) { params.push(status); where.push(`status = $${params.length}`); }
    if (from)   { params.push(from);   where.push(`scheduled_at >= $${params.length}`); }
    if (to)     { params.push(to);     where.push(`scheduled_at <= $${params.length}`); }

    const { rows } = await db.query(
      `SELECT e.*,
              (SELECT COUNT(*)::int FROM engagement_attendees a
                WHERE a.engagement_id = e.id AND a.org_id = e.org_id) AS attendee_count
       FROM medical_engagements e
       WHERE ${where.join(' AND ')}
       ORDER BY scheduled_at DESC NULLS LAST, created_at DESC
       LIMIT 200`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[MedEng] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/medical-engagements/:id — detail + attendees
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', requireRead, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: e } = await db.query(
      `SELECT * FROM medical_engagements WHERE id = $1 AND org_id = $2`,
      [id, req.org_id]
    );
    if (e.length === 0) {
      return res.status(404).json({ error: 'Engagement not found' });
    }

    const { rows: attendees } = await db.query(
      `SELECT a.*, d.name AS doctor_name, d.specialty, d.specialty_code, d.territory,
              k.kol_tier, k.influence_score
       FROM engagement_attendees a
       JOIN doctor_profiles d ON d.id = a.doctor_id AND d.org_id = a.org_id
       LEFT JOIN kol_profiles k ON k.doctor_id = a.doctor_id AND k.org_id = a.org_id
       WHERE a.engagement_id = $1 AND a.org_id = $2
       ORDER BY a.attendee_role, d.name`,
      [id, req.org_id]
    );

    res.json({ success: true, data: { engagement: e[0], attendees } });
  } catch (err) {
    console.error('[MedEng] detail error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/medical-engagements — create
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', requireWrite, async (req, res) => {
  try {
    const {
      title, engagement_type, product, topic, agenda,
      location, scheduled_at, duration_minutes, status,
    } = req.body;

    if (!title || !engagement_type) {
      return res.status(400).json({ error: 'title and engagement_type are required' });
    }
    if (!VALID_TYPES.includes(engagement_type)) {
      return res.status(400).json({ error: `engagement_type must be one of: ${VALID_TYPES.join(', ')}` });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const { rows } = await db.query(
      `INSERT INTO medical_engagements
        (org_id, title, engagement_type, product, topic, agenda,
         location, scheduled_at, duration_minutes, sponsor_user_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, COALESCE($11,'planned'))
       RETURNING *`,
      [
        req.org_id, title, engagement_type,
        product || null, topic || null, agenda || null,
        location || null, scheduled_at || null,
        duration_minutes || null, req.user.user_id, status,
      ]
    );

    recordAudit({
      req,
      action: 'CREATE',
      tableName: 'medical_engagements',
      rowId: rows[0].id,
      after: rows[0],
      reason: `Created ${engagement_type} "${title}"`,
    });

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[MedEng] create error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/medical-engagements/:id — update
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', requireWrite, async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['title', 'engagement_type', 'product', 'topic', 'agenda',
                     'location', 'scheduled_at', 'duration_minutes', 'status', 'outcomes_summary'];
    const fields = [];
    const params = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        params.push(req.body[k]);
        fields.push(`${k} = $${params.length}`);
      }
    }
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No updatable fields supplied' });
    }
    if (req.body.engagement_type && !VALID_TYPES.includes(req.body.engagement_type)) {
      return res.status(400).json({ error: `engagement_type must be one of: ${VALID_TYPES.join(', ')}` });
    }
    if (req.body.status && !VALID_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const { rows: before } = await db.query(
      `SELECT * FROM medical_engagements WHERE id = $1 AND org_id = $2`,
      [id, req.org_id]
    );
    if (before.length === 0) {
      return res.status(404).json({ error: 'Engagement not found' });
    }

    params.push(id, req.org_id);
    const { rows } = await db.query(
      `UPDATE medical_engagements SET ${fields.join(', ')}
       WHERE id = $${params.length - 1} AND org_id = $${params.length}
       RETURNING *`,
      params
    );

    recordAudit({
      req,
      action: 'UPDATE',
      tableName: 'medical_engagements',
      rowId: id,
      before: before[0],
      after: rows[0],
    });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[MedEng] update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/medical-engagements/:id/attendees — add a doctor
// Body: { doctor_id, attendee_role?, honorarium_amt?, honorarium_ccy? }
// Side-effect: stamps last_engagement_at + last_engagement_type on the
// doctor's kol_profile (if one exists).
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/attendees', requireWrite, async (req, res) => {
  const { id } = req.params;
  const { doctor_id, attendee_role, honorarium_amt, honorarium_ccy } = req.body;

  if (!doctor_id) {
    return res.status(400).json({ error: 'doctor_id is required' });
  }
  if (attendee_role && !VALID_ATTENDEE_ROLES.includes(attendee_role)) {
    return res.status(400).json({ error: `attendee_role must be one of: ${VALID_ATTENDEE_ROLES.join(', ')}` });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: e } = await client.query(
      `SELECT * FROM medical_engagements WHERE id = $1 AND org_id = $2`,
      [id, req.org_id]
    );
    if (e.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Engagement not found' });
    }

    const { rowCount: dExists } = await client.query(
      `SELECT 1 FROM doctor_profiles WHERE id = $1 AND org_id = $2`,
      [doctor_id, req.org_id]
    );
    if (dExists === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Doctor not found in this org' });
    }

    const { rows } = await client.query(
      `INSERT INTO engagement_attendees
        (org_id, engagement_id, doctor_id, attendee_role,
         honorarium_amt, honorarium_ccy)
       VALUES ($1,$2,$3, COALESCE($4,'attendee'), $5, COALESCE($6,'INR'))
       RETURNING *`,
      [
        req.org_id, id, doctor_id, attendee_role,
        honorarium_amt || null, honorarium_ccy || null,
      ]
    );

    // If a kol_profile exists for this doctor, stamp last_engagement_*.
    await client.query(
      `UPDATE kol_profiles
       SET last_engagement_at = COALESCE($1, NOW()),
           last_engagement_type = $2
       WHERE org_id = $3 AND doctor_id = $4`,
      [e[0].scheduled_at || null, e[0].engagement_type, req.org_id, doctor_id]
    );

    await client.query('COMMIT');

    recordAudit({
      req,
      action: 'CREATE',
      tableName: 'engagement_attendees',
      rowId: rows[0].id,
      after: rows[0],
      reason: `Doctor ${doctor_id} added as ${attendee_role || 'attendee'} to engagement ${id}`,
    });

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Doctor is already an attendee on this engagement' });
    }
    console.error('[MedEng] attendee add error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/medical-engagements/:id/attendees/:attendee_id — update role / attended / feedback
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/attendees/:attendee_id', requireWrite, async (req, res) => {
  try {
    const { id, attendee_id } = req.params;
    const allowed = ['attendee_role', 'attended', 'honorarium_amt', 'honorarium_ccy', 'feedback'];
    const fields = [];
    const params = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        params.push(req.body[k]);
        fields.push(`${k} = $${params.length}`);
      }
    }
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No updatable fields supplied' });
    }

    params.push(attendee_id, id, req.org_id);
    const { rows } = await db.query(
      `UPDATE engagement_attendees SET ${fields.join(', ')}
       WHERE id = $${params.length - 2} AND engagement_id = $${params.length - 1} AND org_id = $${params.length}
       RETURNING *`,
      params
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Attendee row not found' });
    }

    recordAudit({
      req,
      action: 'UPDATE',
      tableName: 'engagement_attendees',
      rowId: attendee_id,
      after: rows[0],
    });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[MedEng] attendee update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/medical-engagements/:id/attendees/:attendee_id
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id/attendees/:attendee_id', requireWrite, async (req, res) => {
  try {
    const { id, attendee_id } = req.params;
    const { rows: before } = await db.query(
      `SELECT * FROM engagement_attendees
       WHERE id = $1 AND engagement_id = $2 AND org_id = $3`,
      [attendee_id, id, req.org_id]
    );
    if (before.length === 0) {
      return res.status(404).json({ error: 'Attendee row not found' });
    }
    await db.query(
      `DELETE FROM engagement_attendees
       WHERE id = $1 AND engagement_id = $2 AND org_id = $3`,
      [attendee_id, id, req.org_id]
    );
    recordAudit({
      req,
      action: 'DELETE',
      tableName: 'engagement_attendees',
      rowId: attendee_id,
      before: before[0],
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[MedEng] attendee delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
