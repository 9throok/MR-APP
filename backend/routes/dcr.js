const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { scanForAdverseEvents } = require('../services/aeDetection');
const { recordDcrSampleDistributions } = require('../services/sampleDistribution');

// POST /api/dcr — MR submits a new Daily Call Report
router.post('/', async (req, res) => {
  try {
    const { name, date, visit_time, product, samples, callSummary, user_id, doctor_feedback, edetailing } = req.body;

    const { rows } = await db.query(
      `INSERT INTO dcr (org_id, user_id, name, date, visit_time, product, samples, call_summary, doctor_feedback, edetailing)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.org_id,
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

    const savedDcr = rows[0];

    // Async AE detection — fire and forget, never blocks DCR response
    scanForAdverseEvents(savedDcr).catch(err =>
      console.error('[AE] Background scan error:', err.message)
    );

    // Async sample-distribution ledger — debits MR's stock for each sample
    // listed in the DCR. Same fire-and-forget contract as AE detection: this
    // never blocks the DCR response and never throws to the caller.
    recordDcrSampleDistributions(savedDcr).catch(err =>
      console.error('[Samples] DCR hook error:', err.message)
    );

    res.status(201).json({ success: true, data: savedDcr });
  } catch (err) {
    console.error('[DCR] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dcr — Fetch all DCRs (most recent first) or filter by user_id
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;

    let query = 'SELECT * FROM dcr WHERE org_id = $1';
    const params = [req.org_id];

    if (user_id) {
      params.push(user_id);
      query += ` AND user_id = $${params.length}`;
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
