/**
 * routes/specialties.js — Phase C.3
 *
 * Read-only lookup over the controlled-vocabulary `hcp_specialties_taxonomy`.
 * The frontend uses this to populate dropdowns when assigning specialty_code
 * to a doctor profile.
 *
 * Admin-managed updates (adding new codes) can run via SQL today; if a UI is
 * needed later we extend with admin-gated POST/PATCH.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/specialties — list all active codes
// Query: ?category=  (medical / surgical / diagnostic / primary_care / dental / allied / other)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const params = [];
    let where = 'active = TRUE';
    if (category) { params.push(category); where += ` AND category = $${params.length}`; }

    const { rows } = await db.query(
      `SELECT code, display, category, description
       FROM hcp_specialties_taxonomy
       WHERE ${where}
       ORDER BY category, display`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[SPEC] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
