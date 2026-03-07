const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/dcr — MR submits a new Daily Call Report
router.post('/', async (req, res) => {
  try {
    const { name, date, product, samples, callSummary, rating, user_id } = req.body;

    const { rows } = await db.query(
      `INSERT INTO dcr (user_id, name, date, product, samples, call_summary, rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user_id, name, date, product, samples ?? 0, callSummary, rating]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[DCR] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dcr — Fetch all DCRs (most recent first)
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM dcr ORDER BY created_at DESC`
    );

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('[DCR] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
