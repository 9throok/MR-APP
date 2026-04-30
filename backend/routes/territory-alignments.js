/**
 * routes/territory-alignments.js — Phase C.3
 *
 * Versioned MR ↔ territory assignment with effective dates. Solves the
 * "who covered Mumbai-North between 2024-01 and 2024-09" attribution
 * problem that the single-string users.territory cannot answer.
 *
 * Workflow:
 *   - POST creates a new alignment for a user. If an open alignment exists,
 *     it is auto-closed (effective_until = effective_from - 1 day) and the
 *     new one becomes the active row. Transactional.
 *   - GET /current returns the active alignment per user.
 *   - GET /:user_id returns full history for one user.
 *
 * RBAC:
 *   - Read: any authenticated user
 *   - Write: admin or manager
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/auditLog');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/territory-alignments/current — the open row per user
// Query: ?territory=  (filter by territory name)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/current', async (req, res) => {
  try {
    const { territory } = req.query;
    const params = [req.org_id];
    let where = 't.org_id = $1 AND t.effective_until IS NULL';
    if (territory) { params.push(territory); where += ` AND t.territory = $${params.length}`; }

    const { rows } = await db.query(
      `SELECT t.*, u.name AS user_name, u.role AS user_role
       FROM territory_alignments t
       LEFT JOIN users u ON u.user_id = t.user_id AND u.org_id = t.org_id
       WHERE ${where}
       ORDER BY t.territory, t.user_id`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[TALIGN] current error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/territory-alignments/user/:user_id — full history for one user
// ─────────────────────────────────────────────────────────────────────────────
router.get('/user/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { rows } = await db.query(
      `SELECT * FROM territory_alignments
       WHERE org_id = $1 AND user_id = $2
       ORDER BY effective_from DESC`,
      [req.org_id, user_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[TALIGN] user history error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/territory-alignments — assign a user to a territory
// Body: { user_id, territory, effective_from, role_at_time?, notes? }
//
// If an open alignment exists for this user, it's auto-closed at
// effective_from - 1 day (or effective_from if effective_from > existing
// effective_from + 1; defensive). The new row's effective_from defaults to
// today.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', requireRole('admin', 'manager'), async (req, res) => {
  const {
    user_id, territory, role_at_time,
    effective_from, notes,
  } = req.body;

  if (!user_id || !territory) {
    return res.status(400).json({ error: 'user_id and territory are required' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Confirm the user belongs to this org
    const { rowCount: uExists } = await client.query(
      `SELECT 1 FROM users WHERE user_id = $1 AND org_id = $2`,
      [user_id, req.org_id]
    );
    if (uExists === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found in this org' });
    }

    const startDate = effective_from || new Date().toISOString().slice(0, 10);

    // Close any open alignment for this user. Setting effective_until = newStart - 1 day
    // means the new row is contiguous: [old_from, newStart-1] → [newStart, ...).
    await client.query(
      `UPDATE territory_alignments
       SET effective_until = ($1::date - INTERVAL '1 day')::date
       WHERE org_id = $2 AND user_id = $3 AND effective_until IS NULL
         AND effective_from < $1::date`,
      [startDate, req.org_id, user_id]
    );

    const { rows } = await client.query(
      `INSERT INTO territory_alignments
        (org_id, user_id, territory, role_at_time, effective_from, assigned_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.org_id, user_id, territory,
        role_at_time || null, startDate,
        req.user.user_id, notes || null,
      ]
    );

    await client.query('COMMIT');

    recordAudit({
      req,
      action: 'CREATE',
      tableName: 'territory_alignments',
      rowId: rows[0].id,
      after: rows[0],
      reason: `Assigned ${user_id} to ${territory} from ${startDate}`,
    });

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An open alignment already exists; close it first' });
    }
    console.error('[TALIGN] create error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/territory-alignments/:id — close an alignment manually
// Body: { effective_until }
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { effective_until, notes } = req.body;
    if (!effective_until) {
      return res.status(400).json({ error: 'effective_until required' });
    }

    const { rows: before } = await db.query(
      `SELECT * FROM territory_alignments WHERE id = $1 AND org_id = $2`,
      [id, req.org_id]
    );
    if (before.length === 0) {
      return res.status(404).json({ error: 'Alignment not found' });
    }

    const { rows } = await db.query(
      `UPDATE territory_alignments
       SET effective_until = $1, notes = COALESCE($2, notes)
       WHERE id = $3 AND org_id = $4
       RETURNING *`,
      [effective_until, notes || null, id, req.org_id]
    );

    recordAudit({
      req,
      action: 'UPDATE',
      tableName: 'territory_alignments',
      rowId: id,
      before: before[0],
      after: rows[0],
      reason: `Alignment closed at ${effective_until}`,
    });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[TALIGN] update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
