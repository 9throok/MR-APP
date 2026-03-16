const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/rcpa
//
// Body: { pharmacy, doctor_name?, entries: [{ our_brand, our_value, competitor_brand, competitor_company?, competitor_value }] }
//
// Saves one or more RCPA entries for a pharmacy visit.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    const { pharmacy, doctor_name, entries, date } = req.body;

    if (!pharmacy || !entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'pharmacy and entries[] are required' });
    }

    const inserted = [];
    for (const entry of entries) {
      const { our_brand, our_value, competitor_brand, competitor_company, competitor_value } = entry;
      if (!our_brand || !competitor_brand) continue;

      const { rows } = await db.query(
        `INSERT INTO rcpa (user_id, pharmacy, doctor_name, our_brand, our_value, competitor_brand, competitor_company, competitor_value, date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [user_id, pharmacy, doctor_name || null, our_brand, our_value || 0, competitor_brand, competitor_company || null, competitor_value || 0, date || new Date().toISOString().split('T')[0]]
      );
      inserted.push(rows[0]);
    }

    res.status(201).json({ success: true, count: inserted.length, data: inserted });
  } catch (err) {
    console.error('[RCPA] save error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/rcpa
//
// Query params: user_id (optional), from_date, to_date
//
// Returns RCPA entries with optional filters.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { user_id, from_date, to_date } = req.query;
    const conditions = [];
    const params = [];

    if (user_id) {
      params.push(user_id);
      conditions.push(`user_id = $${params.length}`);
    }
    if (from_date) {
      params.push(from_date);
      conditions.push(`date >= $${params.length}`);
    }
    if (to_date) {
      params.push(to_date);
      conditions.push(`date <= $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT * FROM rcpa ${where} ORDER BY date DESC, id DESC LIMIT 500`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[RCPA] fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
