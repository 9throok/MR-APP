const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');
const multer = require('multer');
const XLSX = require('xlsx');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/targets/template
// Download blank CSV template for target upload
// ─────────────────────────────────────────────────────────────────────────────
router.get('/template', requireRole('manager', 'admin'), (req, res) => {
  const csv = 'MR User ID,Product Name,Period (YYYY-MM),Target Quantity,Target Value\n' +
              'mr_rahul_001,Derise 10mg,2026-03,500,4000.00\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=targets_upload_template.csv');
  res.send(csv);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/targets
// List targets with filters
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { user_id, period, product_id } = req.query;
    const conditions = ['t.org_id = $1'];
    const params = [req.org_id];

    // MRs see only their own targets
    if (req.user.role === 'mr') {
      params.push(req.user.user_id);
      conditions.push(`t.user_id = $${params.length}`);
    } else if (user_id) {
      params.push(user_id);
      conditions.push(`t.user_id = $${params.length}`);
    }

    if (period) {
      params.push(period);
      conditions.push(`t.period = $${params.length}`);
    }
    if (product_id) {
      params.push(product_id);
      conditions.push(`t.product_id = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows } = await db.query(
      `SELECT t.*, p.name AS product_name
       FROM mr_targets t
       JOIN products p ON p.id = t.product_id AND p.org_id = t.org_id
       ${where}
       ORDER BY t.period DESC, t.user_id, p.name`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Targets] fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/targets
// Set a single target (UPSERT) — manager/admin only
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { user_id, product_id, period, target_qty, target_value } = req.body;

    if (!user_id || !product_id || !period || target_qty === undefined || target_value === undefined) {
      return res.status(400).json({ error: 'user_id, product_id, period, target_qty, and target_value are required' });
    }

    const { rows } = await db.query(
      `INSERT INTO mr_targets (org_id, user_id, product_id, period, target_qty, target_value, set_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (org_id, user_id, product_id, period)
       DO UPDATE SET target_qty = $5, target_value = $6, set_by = $7, updated_at = NOW()
       RETURNING *`,
      [req.org_id, user_id, product_id, period, target_qty, target_value, req.user.user_id]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Targets] create error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/targets/bulk
// Bulk set targets — manager/admin only
// Body: { targets: [{ user_id, product_id, period, target_qty, target_value }] }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/bulk', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { targets } = req.body;
    if (!Array.isArray(targets) || !targets.length) {
      return res.status(400).json({ error: 'targets[] array is required' });
    }

    const results = [];
    for (const t of targets) {
      const { user_id, product_id, period, target_qty, target_value } = t;
      if (!user_id || !product_id || !period || target_qty === undefined || target_value === undefined) {
        continue;
      }

      const { rows } = await db.query(
        `INSERT INTO mr_targets (org_id, user_id, product_id, period, target_qty, target_value, set_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (org_id, user_id, product_id, period)
         DO UPDATE SET target_qty = $5, target_value = $6, set_by = $7, updated_at = NOW()
         RETURNING *`,
        [req.org_id, user_id, product_id, period, target_qty, target_value, req.user.user_id]
      );
      results.push(rows[0]);
    }

    res.status(201).json({ success: true, count: results.length, data: results });
  } catch (err) {
    console.error('[Targets] bulk error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/targets/upload
// CSV upload for targets — manager/admin only
// ─────────────────────────────────────────────────────────────────────────────
router.post('/upload', requireRole('manager', 'admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows.length) return res.status(400).json({ error: 'File is empty' });

    // Preload products for matching (org-scoped)
    const { rows: products } = await db.query(
      'SELECT id, name FROM products WHERE org_id = $1',
      [req.org_id]
    );
    const productMap = {};
    products.forEach(p => { productMap[p.name.toLowerCase().trim()] = p.id; });

    const inserted = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const mrUserId = (row['MR User ID'] || '').toString().trim();
      const productName = (row['Product Name'] || '').toString().trim();
      const period = (row['Period (YYYY-MM)'] || row['Period'] || '').toString().trim();
      const targetQty = parseInt(row['Target Quantity'], 10);
      const targetValue = parseFloat(row['Target Value']);

      if (!mrUserId) { errors.push({ row: rowNum, message: 'Missing MR User ID' }); continue; }
      if (!productName) { errors.push({ row: rowNum, message: 'Missing Product Name' }); continue; }
      if (!period || !/^\d{4}-\d{2}$/.test(period)) { errors.push({ row: rowNum, message: `Invalid period: '${period}' (use YYYY-MM)` }); continue; }
      if (isNaN(targetQty) || targetQty < 0) { errors.push({ row: rowNum, message: 'Invalid Target Quantity' }); continue; }
      if (isNaN(targetValue) || targetValue < 0) { errors.push({ row: rowNum, message: 'Invalid Target Value' }); continue; }

      const productId = productMap[productName.toLowerCase()];
      if (!productId) { errors.push({ row: rowNum, message: `Unknown product: '${productName}'` }); continue; }

      try {
        const { rows: insertedRows } = await db.query(
          `INSERT INTO mr_targets (org_id, user_id, product_id, period, target_qty, target_value, set_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (org_id, user_id, product_id, period)
           DO UPDATE SET target_qty = $5, target_value = $6, set_by = $7, updated_at = NOW()
           RETURNING id`,
          [req.org_id, mrUserId, productId, period, targetQty, targetValue, req.user.user_id]
        );
        inserted.push(insertedRows[0].id);
      } catch (dbErr) {
        errors.push({ row: rowNum, message: dbErr.message });
      }
    }

    res.json({
      success: true,
      inserted: inserted.length,
      errors: errors,
      total_rows: rows.length
    });
  } catch (err) {
    console.error('[Targets] upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/targets/:id
// Delete a target — manager/admin only
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      'DELETE FROM mr_targets WHERE id = $1 AND org_id = $2 RETURNING id',
      [req.params.id, req.org_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Target not found' });
    res.json({ success: true, deleted: rows[0].id });
  } catch (err) {
    console.error('[Targets] delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
