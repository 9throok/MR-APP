const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/dcr — MR submits a new Daily Call Report
router.post('/', async (req, res) => {
  try {
    const { name, date, visit_time, product, samples, callSummary, user_id, doctor_feedback, edetailing } = req.body;

    const { rows } = await db.query(
      `INSERT INTO dcr (user_id, name, date, visit_time, product, samples, call_summary, doctor_feedback, edetailing)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        user_id, 
        name, 
        date || null,
        visit_time || new Date().toISOString(),
        product, 
        samples ? JSON.stringify(samples) : null,
        callSummary || null, 
        doctor_feedback || null, 
        edetailing ? JSON.stringify(edetailing) : null
      ]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[DCR] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dcr — Fetch all DCRs (most recent first) or filter by user_id
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;

    let query = 'SELECT * FROM dcr';
    let params = [];

    if (user_id) {
      query += ' WHERE user_id = $1';
      params.push(user_id);
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await db.query(query, params);

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('[DCR] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
