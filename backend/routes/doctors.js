const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');

// GET /api/doctors — list all doctor profiles
router.get('/', async (req, res) => {
  try {
    const { territory, tier } = req.query;
    const conditions = [];
    const params = [];

    if (territory) {
      params.push(territory);
      conditions.push(`territory = $${params.length}`);
    }
    if (tier) {
      params.push(tier);
      conditions.push(`tier = $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT * FROM doctor_profiles ${where} ORDER BY tier ASC, name ASC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Doctors] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/doctors — create a doctor profile
router.post('/', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { name, specialty, tier, territory, preferred_visit_day, hospital, phone, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const { rows } = await db.query(
      `INSERT INTO doctor_profiles (name, specialty, tier, territory, preferred_visit_day, hospital, phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, specialty || null, tier || 'B', territory || null, preferred_visit_day || null, hospital || null, phone || null, notes || null]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Doctors] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/doctors/:id — update a doctor profile
router.patch('/:id', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, specialty, tier, territory, preferred_visit_day, hospital, phone, notes } = req.body;

    const { rows } = await db.query(
      `UPDATE doctor_profiles
       SET name = COALESCE($1, name),
           specialty = COALESCE($2, specialty),
           tier = COALESCE($3, tier),
           territory = COALESCE($4, territory),
           preferred_visit_day = COALESCE($5, preferred_visit_day),
           hospital = COALESCE($6, hospital),
           phone = COALESCE($7, phone),
           notes = COALESCE($8, notes)
       WHERE id = $9
       RETURNING *`,
      [name, specialty, tier, territory, preferred_visit_day, hospital, phone, notes, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Doctors] PATCH error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/doctors/:id
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('DELETE FROM doctor_profiles WHERE id = $1 RETURNING *', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ success: true, message: 'Doctor profile deleted' });
  } catch (err) {
    console.error('[Doctors] DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
