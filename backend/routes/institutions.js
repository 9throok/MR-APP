/**
 * routes/institutions.js — Phase C.3
 *
 * Hospital + clinic master data. Single table, type-discriminated. Separate
 * from pharmacy_profiles (channel-side).
 *
 * RBAC:
 *   - Read (list/detail): any authenticated user
 *   - Write (create/update/delete): admin or manager
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/auditLog');

const VALID_TYPES = [
  'hospital_public',
  'hospital_private',
  'clinic',
  'nursing_home',
  'medical_center',
  'diagnostic_center',
  'other',
];

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/institutions — list with filters
// Query: ?type=&territory=&city=&q= (q matches name)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { type, territory, city, q } = req.query;
    const params = [req.org_id];
    const where = ['org_id = $1'];

    if (type)      { params.push(type);      where.push(`institution_type = $${params.length}`); }
    if (territory) { params.push(territory); where.push(`territory = $${params.length}`); }
    if (city)      { params.push(city);      where.push(`city = $${params.length}`); }
    if (q)         { params.push(`%${q}%`);  where.push(`name ILIKE $${params.length}`); }

    const { rows } = await db.query(
      `SELECT i.*,
              (SELECT COUNT(*)::int FROM hcp_affiliations a
                WHERE a.institution_id = i.id AND a.org_id = i.org_id
                  AND a.effective_until IS NULL) AS active_doctor_count
       FROM institutions i
       WHERE ${where.join(' AND ')}
       ORDER BY i.name ASC
       LIMIT 500`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[INST] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/institutions/:id — detail + affiliated doctors
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT * FROM institutions WHERE id = $1 AND org_id = $2`,
      [id, req.org_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const { rows: affiliations } = await db.query(
      `SELECT a.id, a.role, a.department, a.is_primary, a.effective_from, a.effective_until,
              d.id AS doctor_id, d.name AS doctor_name, d.specialty, d.specialty_code, d.tier
       FROM hcp_affiliations a
       JOIN doctor_profiles d ON d.id = a.doctor_id AND d.org_id = a.org_id
       WHERE a.institution_id = $1 AND a.org_id = $2
       ORDER BY a.effective_until IS NULL DESC, a.effective_from DESC`,
      [id, req.org_id]
    );

    res.json({ success: true, data: { institution: rows[0], affiliations } });
  } catch (err) {
    console.error('[INST] detail error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/institutions — create
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const {
      name, institution_type, bed_count, city, state, country,
      pincode, address, phone, website, tier, territory, notes,
    } = req.body;

    if (!name || !institution_type) {
      return res.status(400).json({ error: 'name and institution_type are required' });
    }
    if (!VALID_TYPES.includes(institution_type)) {
      return res.status(400).json({ error: `institution_type must be one of: ${VALID_TYPES.join(', ')}` });
    }

    const { rows } = await db.query(
      `INSERT INTO institutions
        (org_id, name, institution_type, bed_count, city, state, country,
         pincode, address, phone, website, tier, territory, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7,'IN'), $8, $9, $10, $11, COALESCE($12,'B'), $13, $14, $15)
       RETURNING *`,
      [
        req.org_id, name, institution_type,
        bed_count || null, city || null, state || null, country,
        pincode || null, address || null, phone || null, website || null,
        tier, territory || null, notes || null, req.user.user_id,
      ]
    );

    recordAudit({
      req,
      action: 'CREATE',
      tableName: 'institutions',
      rowId: rows[0].id,
      after: rows[0],
      reason: `Created institution "${name}" (${institution_type})`,
    });

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An institution with this name already exists in this city' });
    }
    console.error('[INST] create error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/institutions/:id
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['name', 'institution_type', 'bed_count', 'city', 'state', 'country',
                     'pincode', 'address', 'phone', 'website', 'tier', 'territory', 'notes'];
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
    if (req.body.institution_type && !VALID_TYPES.includes(req.body.institution_type)) {
      return res.status(400).json({ error: `institution_type must be one of: ${VALID_TYPES.join(', ')}` });
    }

    const { rows: before } = await db.query(
      `SELECT * FROM institutions WHERE id = $1 AND org_id = $2`,
      [id, req.org_id]
    );
    if (before.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    params.push(id, req.org_id);
    const { rows } = await db.query(
      `UPDATE institutions SET ${fields.join(', ')}
       WHERE id = $${params.length - 1} AND org_id = $${params.length}
       RETURNING *`,
      params
    );

    recordAudit({
      req,
      action: 'UPDATE',
      tableName: 'institutions',
      rowId: id,
      before: before[0],
      after: rows[0],
    });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[INST] update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/institutions/:id
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: before } = await db.query(
      `SELECT * FROM institutions WHERE id = $1 AND org_id = $2`,
      [id, req.org_id]
    );
    if (before.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    await db.query(
      `DELETE FROM institutions WHERE id = $1 AND org_id = $2`,
      [id, req.org_id]
    );

    recordAudit({
      req,
      action: 'DELETE',
      tableName: 'institutions',
      rowId: id,
      before: before[0],
      reason: 'Institution deleted',
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[INST] delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
