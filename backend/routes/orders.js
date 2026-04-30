const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');

const VALID_CUSTOMER_TYPES = ['doctor', 'pharmacy', 'distributor'];
const VALID_STATUSES = ['draft', 'placed', 'fulfilled', 'cancelled'];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Insert line items in a transaction. Each line's line_total = qty × unit_price.
async function insertLines(client, orgId, orderId, lines) {
  if (!Array.isArray(lines) || lines.length === 0) return [];
  const inserted = [];
  for (const l of lines) {
    if (!l || !l.product_name || !l.quantity || l.unit_price == null) continue;
    const qty = parseInt(l.quantity, 10);
    const unitPrice = parseFloat(l.unit_price);
    const lineTotal = +(qty * unitPrice).toFixed(2);
    const { rows } = await client.query(
      `INSERT INTO order_line_items
         (org_id, order_id, product_id, product_name, sku, quantity, unit_price, line_total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [orgId, orderId, l.product_id || null, l.product_name, l.sku || null,
       qty, unitPrice, lineTotal]
    );
    inserted.push(rows[0]);
  }
  return inserted;
}

// Recompute the order's total_amount from its line items.
async function recomputeOrderTotal(client, orderId, orgId) {
  const { rows } = await client.query(
    `SELECT COALESCE(SUM(line_total), 0) AS total
     FROM order_line_items
     WHERE order_id = $1 AND org_id = $2`,
    [orderId, orgId]
  );
  await client.query(
    'UPDATE orders SET total_amount = $1 WHERE id = $2 AND org_id = $3',
    [rows[0].total, orderId, orgId]
  );
  return rows[0].total;
}

// Resolve which customer FK column to populate, and snapshot the customer name.
async function resolveCustomer(orgId, customerType, customerId) {
  if (!VALID_CUSTOMER_TYPES.includes(customerType)) {
    const err = new Error(`Invalid customer_type. Must be one of: ${VALID_CUSTOMER_TYPES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  if (!customerId) {
    const err = new Error('customer_id is required');
    err.statusCode = 400;
    throw err;
  }
  const tableMap = {
    doctor: 'doctor_profiles',
    pharmacy: 'pharmacy_profiles',
    distributor: 'distributors'
  };
  const { rows } = await db.query(
    `SELECT name FROM ${tableMap[customerType]} WHERE id = $1 AND org_id = $2`,
    [customerId, orgId]
  );
  if (rows.length === 0) {
    const err = new Error(`${customerType} with id ${customerId} not found in this org`);
    err.statusCode = 404;
    throw err;
  }
  return {
    customerName: rows[0].name,
    fkCol: customerType === 'doctor' ? 'doctor_id'
         : customerType === 'pharmacy' ? 'pharmacy_id'
         : 'distributor_id'
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/stats — counts by status (manager view)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'placed')::int    AS placed,
         COUNT(*) FILTER (WHERE status = 'fulfilled')::int AS fulfilled,
         COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
         COUNT(*) FILTER (WHERE status = 'draft')::int     AS draft,
         COALESCE(SUM(total_amount) FILTER (WHERE status = 'placed'), 0)    AS placed_value,
         COALESCE(SUM(total_amount) FILTER (WHERE status = 'fulfilled'), 0) AS fulfilled_value
       FROM orders
       WHERE org_id = $1`,
      [req.org_id]
    );
    res.json({ success: true, stats: rows[0] });
  } catch (err) {
    console.error('[Orders] stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders — list orders. MR sees own; manager/admin sees all in org.
// Filters: ?status, ?user_id (manager), ?customer_type, ?from_date, ?to_date
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, user_id, customer_type, from_date, to_date } = req.query;
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
    if (customer_type) {
      params.push(customer_type);
      conditions.push(`customer_type = $${params.length}`);
    }
    if (from_date) {
      params.push(from_date);
      conditions.push(`order_date >= $${params.length}`);
    }
    if (to_date) {
      params.push(to_date);
      conditions.push(`order_date <= $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await db.query(
      `SELECT * FROM orders ${where} ORDER BY order_date DESC, id DESC LIMIT 500`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Orders] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/:id — one order + its line items
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND org_id = $2',
      [id, req.org_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = rows[0];
    if (req.user.role === 'mr' && order.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Cannot view another MR\'s order' });
    }
    const { rows: lines } = await db.query(
      'SELECT * FROM order_line_items WHERE order_id = $1 AND org_id = $2 ORDER BY id ASC',
      [id, req.org_id]
    );
    res.json({ success: true, data: { ...order, line_items: lines } });
  } catch (err) {
    console.error('[Orders] get error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders — MR creates an order (placed by default)
// Body: { customer_type, customer_id, order_date?, status?, notes?, line_items: [...] }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  if (req.user.role !== 'mr' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only MRs can create orders' });
  }
  const { customer_type, customer_id, order_date, status, notes, line_items, currency } = req.body;

  if (!customer_type || !customer_id) {
    return res.status(400).json({ error: 'customer_type and customer_id are required' });
  }
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be: ${VALID_STATUSES.join(', ')}` });
  }
  if (!Array.isArray(line_items) || line_items.length === 0) {
    return res.status(400).json({ error: 'At least one line item is required' });
  }

  let resolved;
  try {
    resolved = await resolveCustomer(req.org_id, customer_type, customer_id);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const fkCol = resolved.fkCol;
    const { rows } = await client.query(
      `INSERT INTO orders
         (org_id, user_id, customer_type, ${fkCol}, customer_name, order_date, status, currency, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.org_id, req.user.user_id, customer_type, customer_id, resolved.customerName,
       order_date || new Date().toISOString().split('T')[0],
       status || 'placed', currency || 'INR', notes || null]
    );
    const order = rows[0];
    const insertedLines = await insertLines(client, req.org_id, order.id, line_items);
    await recomputeOrderTotal(client, order.id, req.org_id);
    const { rows: refreshed } = await client.query(
      'SELECT * FROM orders WHERE id = $1', [order.id]
    );
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: { ...refreshed[0], line_items: insertedLines } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Orders] create error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/orders/:id — owner edits a draft or placed order (replace-all lines)
// Body: { customer_type?, customer_id?, order_date?, notes?, line_items? }
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { customer_type, customer_id, order_date, notes, line_items, currency } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: existing } = await client.query(
      'SELECT * FROM orders WHERE id = $1 AND org_id = $2 FOR UPDATE',
      [id, req.org_id]
    );
    if (existing.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = existing[0];
    if (order.user_id !== req.user.user_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Cannot edit another MR\'s order' });
    }
    if (!['draft', 'placed'].includes(order.status)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `Cannot edit order in status '${order.status}'` });
    }

    // If customer is changing, re-resolve and clear other FK cols
    let custUpdate = '';
    const fields = [];
    const params = [];
    if (customer_type && customer_id) {
      let resolved;
      try {
        resolved = await resolveCustomer(req.org_id, customer_type, customer_id);
      } catch (err) {
        await client.query('ROLLBACK');
        return res.status(err.statusCode || 500).json({ error: err.message });
      }
      params.push(customer_type); fields.push(`customer_type = $${params.length}`);
      params.push(resolved.customerName); fields.push(`customer_name = $${params.length}`);
      // Clear all FK cols then set the right one
      fields.push('doctor_id = NULL', 'pharmacy_id = NULL', 'distributor_id = NULL');
      params.push(customer_id); fields.push(`${resolved.fkCol} = $${params.length}`);
    }
    if (order_date !== undefined) { params.push(order_date); fields.push(`order_date = $${params.length}`); }
    if (notes !== undefined)      { params.push(notes);      fields.push(`notes = $${params.length}`); }
    if (currency !== undefined)   { params.push(currency);   fields.push(`currency = $${params.length}`); }

    if (fields.length > 0) {
      params.push(id, req.org_id);
      await client.query(
        `UPDATE orders SET ${fields.join(', ')}
         WHERE id = $${params.length - 1} AND org_id = $${params.length}`,
        params
      );
    }

    let lines;
    if (Array.isArray(line_items)) {
      await client.query(
        'DELETE FROM order_line_items WHERE order_id = $1 AND org_id = $2',
        [id, req.org_id]
      );
      lines = await insertLines(client, req.org_id, id, line_items);
    } else {
      const { rows: existingLines } = await client.query(
        'SELECT * FROM order_line_items WHERE order_id = $1 AND org_id = $2 ORDER BY id ASC',
        [id, req.org_id]
      );
      lines = existingLines;
    }

    await recomputeOrderTotal(client, id, req.org_id);
    const { rows: refreshed } = await client.query(
      'SELECT * FROM orders WHERE id = $1', [id]
    );
    await client.query('COMMIT');
    res.json({ success: true, data: { ...refreshed[0], line_items: lines } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Orders] update error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/orders/:id/status — transition order status
// MR can: placed → cancelled (own orders only)
// Manager/admin can: placed → fulfilled / cancelled, draft → placed / cancelled
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Valid status required: ${VALID_STATUSES.join(', ')}` });
  }

  try {
    const { rows: existing } = await db.query(
      'SELECT user_id, status FROM orders WHERE id = $1 AND org_id = $2',
      [id, req.org_id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = existing[0];
    const isOwner = order.user_id === req.user.user_id;
    const isManager = req.user.role === 'manager' || req.user.role === 'admin';

    // MR: can only cancel own orders
    if (!isManager && (!isOwner || status !== 'cancelled')) {
      return res.status(403).json({ error: 'MRs can only cancel their own orders' });
    }
    // Disallow transitions out of terminal states
    if (['fulfilled', 'cancelled'].includes(order.status)) {
      return res.status(409).json({ error: `Cannot change status from terminal state '${order.status}'` });
    }

    const { rows } = await db.query(
      `UPDATE orders SET status = $1
       WHERE id = $2 AND org_id = $3
       RETURNING *`,
      [status, id, req.org_id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Orders] status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/orders/:id — owner deletes a draft order
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `DELETE FROM orders
       WHERE id = $1 AND org_id = $2 AND user_id = $3 AND status = 'draft'
       RETURNING id`,
      [id, req.org_id, req.user.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found, not yours, or not in draft status' });
    }
    res.json({ success: true, deleted: rows[0].id });
  } catch (err) {
    console.error('[Orders] delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
