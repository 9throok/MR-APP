/**
 * routes/pharmacies.js — read-only pharmacy lookup
 *
 * Mirrors the read shape of routes/doctors.js. Used by OrderBooking and any
 * other UI that needs a pharmacy pick-list. Write operations (manager creates
 * a pharmacy) live elsewhere; this file is a lookup surface only.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/pharmacies — list pharmacy profiles
// Query: ?territory=&q= (name search)
router.get('/', async (req, res) => {
  try {
    let { territory, q } = req.query;
    const conditions = ['org_id = $1'];
    const params = [req.org_id];

    if (req.user.role === 'mr' && req.user.territory) {
      territory = req.user.territory;
    }

    if (territory) {
      params.push(territory);
      conditions.push(`territory = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await db.query(
      `SELECT id, name, type, tier, territory, preferred_visit_day, address, phone, contact_person, notes, created_at
       FROM pharmacy_profiles ${where}
       ORDER BY tier ASC, name ASC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Pharmacies] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
