/**
 * routes/distributors.js — read-only distributor lookup
 *
 * Used by OrderBooking and reporting surfaces that need a distributor
 * pick-list. Distributors are a reference table (no MR-scoping); managers
 * see all rows in their org.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/distributors — list distributors
// Query: ?territory=&q=
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
      conditions.push(`(name ILIKE $${params.length} OR code ILIKE $${params.length})`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await db.query(
      `SELECT id, name, territory, code, created_at
       FROM distributors ${where}
       ORDER BY territory ASC, name ASC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Distributors] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
