/**
 * routes/users.js — manager/admin-gated user lookup
 *
 * Frontend manager directories (MRList, MRDetail) need a way to see who's in
 * the org. The auth router only exposes /me; this fills the gap.
 *
 * Read-only. Manager + admin only. Never returns password_hash.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');

const requireManagerOrAdmin = requireRole('manager', 'admin');

// GET /api/users — list users in the caller's org
// Query: ?role=mr|manager|admin|medical_reviewer|legal_reviewer|regulatory_reviewer
//        ?territory=...
//        ?q= (matches name, username, email)
router.get('/', requireManagerOrAdmin, async (req, res) => {
  try {
    const { role, territory, q } = req.query;
    const conditions = ['org_id = $1'];
    const params = [req.org_id];

    if (role) {
      params.push(role);
      conditions.push(`role = $${params.length}`);
    }
    if (territory) {
      params.push(territory);
      conditions.push(`territory = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(name ILIKE $${params.length} OR username ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await db.query(
      `SELECT id, user_id, username, email, role, name, territory, created_at
       FROM users ${where}
       ORDER BY role ASC, name ASC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Users] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:user_id — single user
// Note: param is the textual user_id (e.g. 'mr_rahul_001'), not the integer id.
router.get('/:user_id', requireManagerOrAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, user_id, username, email, role, name, territory, created_at
       FROM users WHERE org_id = $1 AND user_id = $2`,
      [req.org_id, req.params.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Users] detail error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
