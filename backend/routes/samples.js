const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');
const { applyMovement } = require('../services/sampleMovements');

const VALID_TYPES = ['allocation', 'distribution', 'return', 'adjustment', 'expiry'];

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/samples/stock — current stock balances
// MR sees own stock; manager/admin sees all in org. Filters: ?user_id, ?product_id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stock', async (req, res) => {
  try {
    const { user_id, product_id } = req.query;
    const conditions = ['ss.org_id = $1'];
    const params = [req.org_id];

    if (req.user.role === 'mr') {
      params.push(req.user.user_id);
      conditions.push(`ss.user_id = $${params.length}`);
    } else if (user_id) {
      params.push(user_id);
      conditions.push(`ss.user_id = $${params.length}`);
    }
    if (product_id) {
      params.push(product_id);
      conditions.push(`ss.product_id = $${params.length}`);
    }
    // Hide zero balances by default — UX clutter otherwise.
    conditions.push('ss.quantity > 0');

    const where = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await db.query(
      `SELECT ss.*, p.name AS product_name
       FROM sample_stock ss
       JOIN products p ON p.id = ss.product_id AND p.org_id = ss.org_id
       ${where}
       ORDER BY ss.user_id, p.name, ss.expiry_date NULLS LAST`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Samples] stock list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/samples/movements — audit trail (MR sees own, manager sees all)
// Filters: ?user_id, ?product_id, ?movement_type, ?from_date, ?to_date
// ─────────────────────────────────────────────────────────────────────────────
router.get('/movements', async (req, res) => {
  try {
    const { user_id, product_id, movement_type, from_date, to_date } = req.query;
    const conditions = ['m.org_id = $1'];
    const params = [req.org_id];

    if (req.user.role === 'mr') {
      params.push(req.user.user_id);
      conditions.push(`m.user_id = $${params.length}`);
    } else if (user_id) {
      params.push(user_id);
      conditions.push(`m.user_id = $${params.length}`);
    }
    if (product_id) {
      params.push(product_id);
      conditions.push(`m.product_id = $${params.length}`);
    }
    if (movement_type) {
      params.push(movement_type);
      conditions.push(`m.movement_type = $${params.length}`);
    }
    if (from_date) {
      params.push(from_date);
      conditions.push(`m.created_at >= $${params.length}`);
    }
    if (to_date) {
      params.push(to_date);
      conditions.push(`m.created_at <= $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await db.query(
      `SELECT m.*, p.name AS product_name
       FROM sample_movements m
       JOIN products p ON p.id = m.product_id AND p.org_id = m.org_id
       ${where}
       ORDER BY m.created_at DESC, m.id DESC LIMIT 500`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Samples] movements list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/samples/allocate — manager allocates a lot to an MR
// Body: { user_id, product_id, lot_number, expiry_date?, quantity, notes? }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/allocate', requireRole('manager', 'admin'), async (req, res) => {
  const { user_id, product_id, lot_number, expiry_date, quantity, notes } = req.body;
  if (!user_id || !product_id || !lot_number || !quantity) {
    return res.status(400).json({ error: 'user_id, product_id, lot_number, and quantity are required' });
  }
  if (quantity <= 0) {
    return res.status(400).json({ error: 'quantity must be positive' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await applyMovement(client, {
      org_id: req.org_id,
      user_id,
      product_id,
      lot_number,
      expiry_date: expiry_date || null,
      movement_type: 'allocation',
      quantity,
      recorded_by: req.user.user_id,
      notes: notes || null
    });
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    console.error('[Samples] allocate error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/samples/return — MR returns leftover stock to the manager
// Body: { product_id, lot_number, quantity, notes? }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/return', async (req, res) => {
  const { product_id, lot_number, quantity, notes } = req.body;
  if (!product_id || !lot_number || !quantity) {
    return res.status(400).json({ error: 'product_id, lot_number, and quantity are required' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await applyMovement(client, {
      org_id: req.org_id,
      user_id: req.user.user_id,
      product_id,
      lot_number,
      movement_type: 'return',
      quantity,
      recorded_by: req.user.user_id,
      notes: notes || null
    });
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    console.error('[Samples] return error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/samples/adjust — manager corrects stock (positive or negative)
// Body: { user_id, product_id, lot_number, delta_qty, notes }
//   delta_qty positive = add stock, negative = remove
// ─────────────────────────────────────────────────────────────────────────────
router.post('/adjust', requireRole('manager', 'admin'), async (req, res) => {
  const { user_id, product_id, lot_number, delta_qty, notes } = req.body;
  if (!user_id || !product_id || !lot_number || delta_qty == null) {
    return res.status(400).json({ error: 'user_id, product_id, lot_number, and delta_qty are required' });
  }
  if (delta_qty === 0) {
    return res.status(400).json({ error: 'delta_qty cannot be zero' });
  }
  if (!notes) {
    return res.status(400).json({ error: 'notes are required for adjustments (audit requirement)' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    // Adjustments record movement_type='adjustment' with quantity=ABS(delta).
    // The applyMovement helper looks at the sign-by-type rule, so we need a
    // small explicit override: pass delta directly so the helper just adds it.
    const result = await applyMovement(client, {
      org_id: req.org_id,
      user_id,
      product_id,
      lot_number,
      movement_type: 'adjustment',
      quantity: Math.abs(delta_qty),
      adjustment_delta: delta_qty,    // explicit signed delta for adjustments
      recorded_by: req.user.user_id,
      notes
    });
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    console.error('[Samples] adjust error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
