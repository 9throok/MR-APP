const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');

const VALID_LEAVE_TYPES = [
  'earned_leave', 'loss_of_pay', 'comp_off', 'sabbatical_leave',
  'sick_leave', 'casual_leave', 'maternity_leave', 'paternity_leave'
];
const VALID_SESSIONS = ['full', 'session_1', 'session_2'];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Compute total leave days from from_date / to_date / session boundaries.
// Same-day half-day = 0.5; same-day full = 1; multi-day = (to - from + 1)
// minus 0.5 for any half-day boundary (session_1 or session_2 not 'full').
function computeTotalDays(fromDate, toDate, fromSession, toSession) {
  const f = new Date(fromDate);
  const t = new Date(toDate);
  const dayMs = 1000 * 60 * 60 * 24;
  const spanDays = Math.round((t - f) / dayMs) + 1;
  if (spanDays <= 0) return 0;

  if (spanDays === 1) {
    return fromSession === 'full' && toSession === 'full' ? 1 : 0.5;
  }
  let days = spanDays;
  if (fromSession !== 'full') days -= 0.5;
  if (toSession !== 'full') days -= 0.5;
  return days;
}

// Recompute used_days for a (user, year, leave_type) by summing approved leaves
// in that calendar year, then upsert the leave_balances row. Caller owns
// transaction state.
async function recomputeBalance(client, orgId, userId, year, leaveType) {
  const { rows } = await client.query(
    `SELECT COALESCE(SUM(total_days), 0) AS used
     FROM leaves
     WHERE org_id = $1 AND user_id = $2 AND leave_type = $3
       AND status = 'approved'
       AND from_date >= make_date($4, 1, 1)
       AND from_date <= make_date($4, 12, 31)`,
    [orgId, userId, leaveType, year]
  );
  await client.query(
    `INSERT INTO leave_balances (org_id, user_id, year, leave_type, used_days, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (org_id, user_id, year, leave_type)
     DO UPDATE SET used_days = $5, updated_at = NOW()`,
    [orgId, userId, year, leaveType, rows[0].used]
  );
  return rows[0].used;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/leaves/stats — pending count for managers
// MUST be before /:id to avoid param capture.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT COUNT(*)::int AS pending,
              COALESCE(SUM(total_days), 0) AS pending_days
       FROM leaves
       WHERE org_id = $1 AND status = 'pending'`,
      [req.org_id]
    );
    res.json({ success: true, stats: rows[0] });
  } catch (err) {
    console.error('[Leaves] stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/leaves/balances — current user's balance ledger (or :user_id if manager)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/balances', async (req, res) => {
  try {
    const { user_id, year } = req.query;
    const targetUserId = req.user.role === 'mr' ? req.user.user_id : (user_id || req.user.user_id);
    const targetYear = parseInt(year, 10) || new Date().getFullYear();

    const { rows } = await db.query(
      `SELECT * FROM leave_balances
       WHERE org_id = $1 AND user_id = $2 AND year = $3
       ORDER BY leave_type ASC`,
      [req.org_id, targetUserId, targetYear]
    );
    res.json({ success: true, data: { user_id: targetUserId, year: targetYear, balances: rows } });
  } catch (err) {
    console.error('[Leaves] balances error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/leaves — list leave applications (MR sees own, manager/admin sees all)
// Filters: ?status, ?user_id (manager), ?from_date, ?to_date, ?leave_type
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, user_id, from_date, to_date, leave_type } = req.query;
    const conditions = ['org_id = $1'];
    const params = [req.org_id];

    if (req.user.role === 'mr') {
      params.push(req.user.user_id);
      conditions.push(`user_id = $${params.length}`);
    } else if (user_id) {
      params.push(user_id);
      conditions.push(`user_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (leave_type) {
      params.push(leave_type);
      conditions.push(`leave_type = $${params.length}`);
    }
    if (from_date) {
      params.push(from_date);
      conditions.push(`to_date >= $${params.length}`);
    }
    if (to_date) {
      params.push(to_date);
      conditions.push(`from_date <= $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await db.query(
      `SELECT * FROM leaves ${where} ORDER BY from_date DESC, id DESC LIMIT 500`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Leaves] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/leaves/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT * FROM leaves WHERE id = $1 AND org_id = $2',
      [id, req.org_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Leave application not found' });
    }
    const leave = rows[0];
    if (req.user.role === 'mr' && leave.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Cannot view another MR\'s leave' });
    }
    res.json({ success: true, data: leave });
  } catch (err) {
    console.error('[Leaves] get error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/leaves — MR applies for leave
// Body: { leave_type, from_date, to_date, from_session?, to_session?, reason, contact_details?, attachment_url? }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  if (req.user.role !== 'mr' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only MRs can apply for leave' });
  }
  const {
    leave_type, from_date, to_date, from_session = 'full', to_session = 'full',
    reason, contact_details, attachment_url
  } = req.body;

  if (!leave_type || !from_date || !to_date || !reason) {
    return res.status(400).json({ error: 'leave_type, from_date, to_date, and reason are required' });
  }
  if (!VALID_LEAVE_TYPES.includes(leave_type)) {
    return res.status(400).json({ error: `Invalid leave_type. Must be one of: ${VALID_LEAVE_TYPES.join(', ')}` });
  }
  if (!VALID_SESSIONS.includes(from_session) || !VALID_SESSIONS.includes(to_session)) {
    return res.status(400).json({ error: 'Invalid session value. Must be: full, session_1, or session_2' });
  }

  const total_days = computeTotalDays(from_date, to_date, from_session, to_session);
  if (total_days <= 0) {
    return res.status(400).json({ error: 'Computed leave duration is zero or negative — check dates and sessions' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO leaves
         (org_id, user_id, leave_type, from_date, to_date, from_session, to_session,
          total_days, reason, contact_details, attachment_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [req.org_id, req.user.user_id, leave_type, from_date, to_date,
       from_session, to_session, total_days, reason,
       contact_details || null, attachment_url || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Leaves] apply error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/leaves/:id/review — manager approves or rejects
// On approval, recompute the user's leave_balances row for that year + type.
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/review', requireRole('manager', 'admin'), async (req, res) => {
  const { id } = req.params;
  const { status, review_notes } = req.body;
  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Valid status required: approved, rejected' });
  }
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE leaves
       SET status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4 AND org_id = $5 AND status = 'pending'
       RETURNING *`,
      [status, review_notes || null, req.user.user_id, id, req.org_id]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Leave not found or not in pending status' });
    }
    const leave = rows[0];

    // On approval, refresh the user's balance ledger for the relevant year + type
    if (status === 'approved') {
      const year = new Date(leave.from_date).getUTCFullYear();
      await recomputeBalance(client, req.org_id, leave.user_id, year, leave.leave_type);
    }

    await client.query('COMMIT');
    res.json({ success: true, data: leave });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Leaves] review error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/leaves/:id/cancel — MR cancels own pending leave
// Allowed only while status = 'pending'.
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `UPDATE leaves
       SET status = 'cancelled'
       WHERE id = $1 AND org_id = $2 AND user_id = $3 AND status = 'pending'
       RETURNING *`,
      [id, req.org_id, req.user.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Leave not found, not yours, or not in pending status' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Leaves] cancel error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/leaves/balances — manager allocates / adjusts a balance for a user
// Body: { user_id, year, leave_type, allocated_days }
// ─────────────────────────────────────────────────────────────────────────────
router.put('/balances', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { user_id, year, leave_type, allocated_days } = req.body;
    if (!user_id || !year || !leave_type || allocated_days == null) {
      return res.status(400).json({ error: 'user_id, year, leave_type, and allocated_days are required' });
    }
    if (!VALID_LEAVE_TYPES.includes(leave_type)) {
      return res.status(400).json({ error: `Invalid leave_type` });
    }
    const { rows } = await db.query(
      `INSERT INTO leave_balances (org_id, user_id, year, leave_type, allocated_days, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (org_id, user_id, year, leave_type)
       DO UPDATE SET allocated_days = $5, updated_at = NOW()
       RETURNING *`,
      [req.org_id, user_id, year, leave_type, allocated_days]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Leaves] balance upsert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
