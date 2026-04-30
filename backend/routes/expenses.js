const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');

const VALID_CLAIM_TYPES = ['local_conveyance', 'travel_allowance', 'general_expense', 'daily_allowance'];

// ── Multer storage for receipt uploads ──────────────────────────────────────
// Receipts go to /uploads/receipts/<claim_id>/ to keep them grouped per claim.
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'receipts', String(req.params.claimId || 'tmp'));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});

const uploadReceipt = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ok = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Only PDF / PNG / JPG / WEBP files allowed'), ok);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Re-aggregate a claim's total from its lines. Caller owns transaction state.
async function recomputeClaimTotal(client, claimId, orgId) {
  const { rows } = await client.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM expense_line_items
     WHERE claim_id = $1 AND org_id = $2`,
    [claimId, orgId]
  );
  await client.query(
    'UPDATE expense_claims SET total_amount = $1 WHERE id = $2 AND org_id = $3',
    [rows[0].total, claimId, orgId]
  );
  return rows[0].total;
}

// Insert one or more line items in the same transaction.
async function insertLines(client, orgId, claimId, lines) {
  if (!Array.isArray(lines) || lines.length === 0) return [];
  const inserted = [];
  for (const l of lines) {
    if (!l || !l.claim_type || l.amount == null) continue;
    if (!VALID_CLAIM_TYPES.includes(l.claim_type)) {
      const err = new Error(`Invalid claim_type: ${l.claim_type}`);
      err.statusCode = 400;
      throw err;
    }
    const { rows } = await client.query(
      `INSERT INTO expense_line_items (
         org_id, claim_id, claim_type, expense_date, from_date, to_date,
         amount, currency, description, remark, attachment_url, doctor_id,
         conveyance_mode, distance_km, rate_per_km, from_place, to_place, transport_class,
         allowance_type, city, days, daily_rate
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       RETURNING *`,
      [
        orgId, claimId, l.claim_type,
        l.expense_date || null, l.from_date || null, l.to_date || null,
        l.amount, l.currency || 'INR', l.description || null, l.remark || null,
        l.attachment_url || null, l.doctor_id || null,
        l.conveyance_mode || null, l.distance_km || null, l.rate_per_km || null,
        l.from_place || null, l.to_place || null, l.transport_class || null,
        l.allowance_type || null, l.city || null, l.days || null, l.daily_rate || null
      ]
    );
    inserted.push(rows[0]);
  }
  return inserted;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/expenses/stats — pending count for managers
// MUST be before /:id to avoid param capture.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT COUNT(*)::int AS pending,
              COALESCE(SUM(total_amount), 0) AS pending_total
       FROM expense_claims
       WHERE org_id = $1 AND status = 'submitted'`,
      [req.org_id]
    );
    res.json({ success: true, stats: rows[0] });
  } catch (err) {
    console.error('[Expenses] stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/expenses — list claims (MR sees own, manager/admin sees all in org)
// Filters: ?status, ?user_id (manager/admin), ?from_date, ?to_date
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, user_id, from_date, to_date } = req.query;
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
    if (from_date) {
      params.push(from_date);
      conditions.push(`period_end >= $${params.length}`);
    }
    if (to_date) {
      params.push(to_date);
      conditions.push(`period_start <= $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await db.query(
      `SELECT * FROM expense_claims ${where} ORDER BY period_start DESC, id DESC LIMIT 500`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Expenses] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/expenses/:id — one claim + its line items
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT * FROM expense_claims WHERE id = $1 AND org_id = $2',
      [id, req.org_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Expense claim not found' });
    }
    const claim = rows[0];
    if (req.user.role === 'mr' && claim.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Cannot view another MR\'s claim' });
    }

    const { rows: lines } = await db.query(
      `SELECT l.*, d.name AS doctor_name
       FROM expense_line_items l
       LEFT JOIN doctor_profiles d ON d.id = l.doctor_id AND d.org_id = l.org_id
       WHERE l.claim_id = $1 AND l.org_id = $2
       ORDER BY COALESCE(l.expense_date, l.from_date) ASC, l.id ASC`,
      [id, req.org_id]
    );
    res.json({ success: true, data: { ...claim, line_items: lines } });
  } catch (err) {
    console.error('[Expenses] get error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/expenses — MR creates a draft claim with line items
// Body: { period_start, period_end, currency?, notes?, line_items: [...] }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  if (req.user.role !== 'mr' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only MRs can create expense claims' });
  }
  const { period_start, period_end, currency, notes, line_items } = req.body;
  if (!period_start || !period_end) {
    return res.status(400).json({ error: 'period_start and period_end are required' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO expense_claims (org_id, user_id, period_start, period_end, currency, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.org_id, req.user.user_id, period_start, period_end, currency || 'INR', notes || null]
    );
    const claim = rows[0];
    const insertedLines = await insertLines(client, req.org_id, claim.id, line_items);
    await recomputeClaimTotal(client, claim.id, req.org_id);
    const { rows: refreshed } = await client.query(
      'SELECT * FROM expense_claims WHERE id = $1', [claim.id]
    );
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: { ...refreshed[0], line_items: insertedLines } });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    console.error('[Expenses] create error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/expenses/:id — owner edits a draft claim (replace-all line items)
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { period_start, period_end, currency, notes, line_items } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the claim, verify ownership + draft status
    const { rows: existing } = await client.query(
      'SELECT * FROM expense_claims WHERE id = $1 AND org_id = $2 FOR UPDATE',
      [id, req.org_id]
    );
    if (existing.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Expense claim not found' });
    }
    const claim = existing[0];
    if (claim.user_id !== req.user.user_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Cannot edit another MR\'s claim' });
    }
    if (claim.status !== 'draft') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `Cannot edit claim in status '${claim.status}' (only drafts are editable)` });
    }

    const fields = [];
    const params = [];
    if (period_start !== undefined) { params.push(period_start); fields.push(`period_start = $${params.length}`); }
    if (period_end !== undefined)   { params.push(period_end);   fields.push(`period_end = $${params.length}`); }
    if (currency !== undefined)     { params.push(currency);     fields.push(`currency = $${params.length}`); }
    if (notes !== undefined)        { params.push(notes);        fields.push(`notes = $${params.length}`); }

    if (fields.length > 0) {
      params.push(id, req.org_id);
      await client.query(
        `UPDATE expense_claims SET ${fields.join(', ')}
         WHERE id = $${params.length - 1} AND org_id = $${params.length}`,
        params
      );
    }

    let lines;
    if (Array.isArray(line_items)) {
      // Replace-all: delete + re-insert
      await client.query(
        'DELETE FROM expense_line_items WHERE claim_id = $1 AND org_id = $2',
        [id, req.org_id]
      );
      lines = await insertLines(client, req.org_id, id, line_items);
    } else {
      const { rows } = await client.query(
        'SELECT * FROM expense_line_items WHERE claim_id = $1 AND org_id = $2 ORDER BY id ASC',
        [id, req.org_id]
      );
      lines = rows;
    }

    await recomputeClaimTotal(client, id, req.org_id);
    const { rows: refreshed } = await client.query(
      'SELECT * FROM expense_claims WHERE id = $1', [id]
    );
    await client.query('COMMIT');
    res.json({ success: true, data: { ...refreshed[0], line_items: lines } });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    console.error('[Expenses] update error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/expenses/:id/submit — owner submits draft for review
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    // Refuse to submit empty claims (no line items) — common UX trap
    const { rows: lineCount } = await db.query(
      'SELECT COUNT(*)::int AS n FROM expense_line_items WHERE claim_id = $1 AND org_id = $2',
      [id, req.org_id]
    );
    if (lineCount[0].n === 0) {
      return res.status(400).json({ error: 'Cannot submit a claim with no line items' });
    }

    const { rows } = await db.query(
      `UPDATE expense_claims
       SET status = 'submitted', submitted_at = NOW()
       WHERE id = $1 AND org_id = $2 AND user_id = $3 AND status = 'draft'
       RETURNING *`,
      [id, req.org_id, req.user.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found, not yours, or not in draft status' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Expenses] submit error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/expenses/:id/review — manager approves or rejects
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
      `UPDATE expense_claims
       SET status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4 AND org_id = $5 AND status = 'submitted'
       RETURNING *`,
      [status, review_notes || null, req.user.user_id, id, req.org_id]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Claim not found or not awaiting review' });
    }
    await client.query('COMMIT');
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Expenses] review error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/expenses/:claimId/lines/:lineId/receipt — upload a receipt for a line
// Owner only, draft status only.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:claimId/lines/:lineId/receipt', uploadReceipt.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const { claimId, lineId } = req.params;

    // Verify ownership + draft status before storing the URL
    const { rows: claim } = await db.query(
      'SELECT user_id, status FROM expense_claims WHERE id = $1 AND org_id = $2',
      [claimId, req.org_id]
    );
    if (claim.length === 0) {
      // delete uploaded file since claim doesn't exist
      try { fs.unlinkSync(req.file.path); } catch (_) { /* ignore */ }
      return res.status(404).json({ error: 'Claim not found' });
    }
    if (claim[0].user_id !== req.user.user_id) {
      try { fs.unlinkSync(req.file.path); } catch (_) { /* ignore */ }
      return res.status(403).json({ error: 'Cannot attach to another MR\'s claim' });
    }
    if (claim[0].status !== 'draft') {
      try { fs.unlinkSync(req.file.path); } catch (_) { /* ignore */ }
      return res.status(409).json({ error: 'Receipts can only be added while the claim is in draft' });
    }

    const url = `/uploads/receipts/${claimId}/${req.file.filename}`;
    const { rows } = await db.query(
      `UPDATE expense_line_items SET attachment_url = $1
       WHERE id = $2 AND claim_id = $3 AND org_id = $4
       RETURNING *`,
      [url, lineId, claimId, req.org_id]
    );
    if (rows.length === 0) {
      try { fs.unlinkSync(req.file.path); } catch (_) { /* ignore */ }
      return res.status(404).json({ error: 'Line item not found in this claim' });
    }
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Expenses] receipt upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/expenses/:id — owner cancels a draft claim
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `DELETE FROM expense_claims
       WHERE id = $1 AND org_id = $2 AND user_id = $3 AND status = 'draft'
       RETURNING id`,
      [id, req.org_id, req.user.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found, not yours, or not in draft status' });
    }
    res.json({ success: true, deleted: rows[0].id });
  } catch (err) {
    console.error('[Expenses] delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
