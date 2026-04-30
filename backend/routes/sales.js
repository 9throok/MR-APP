const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');
const multer = require('multer');
const XLSX = require('xlsx');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sales/distributors
// ─────────────────────────────────────────────────────────────────────────────
router.get('/distributors', async (req, res) => {
  try {
    const { territory } = req.query;
    const conditions = ['org_id = $1'];
    const params = [req.org_id];

    if (territory) {
      params.push(territory);
      conditions.push(`territory = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await db.query(`SELECT * FROM distributors ${where} ORDER BY territory, name`, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Sales] distributors error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sales/summary
// Aggregated sales by product, territory, period
// ─────────────────────────────────────────────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const { user_id, period, territory } = req.query;
    const conditions = ['ss.org_id = $1'];
    const params = [req.org_id];

    // MRs see only their own data
    if (req.user.role === 'mr') {
      params.push(req.user.user_id);
      conditions.push(`ss.user_id = $${params.length}`);
    } else if (user_id) {
      params.push(user_id);
      conditions.push(`ss.user_id = $${params.length}`);
    }

    if (period) {
      params.push(period);
      conditions.push(`to_char(ss.sale_date, 'YYYY-MM') = $${params.length}`);
    }
    if (territory) {
      params.push(territory);
      conditions.push(`ss.territory = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows } = await db.query(
      `SELECT
         ss.user_id,
         ss.territory,
         to_char(ss.sale_date, 'YYYY-MM') AS period,
         p.name AS product_name,
         ss.product_id,
         SUM(ss.quantity) AS total_qty,
         SUM(ss.value) AS total_value
       FROM secondary_sales ss
       JOIN products p ON p.id = ss.product_id AND p.org_id = ss.org_id
       ${where}
       GROUP BY ss.user_id, ss.territory, to_char(ss.sale_date, 'YYYY-MM'), p.name, ss.product_id
       ORDER BY period DESC, ss.user_id, p.name`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Sales] summary error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sales/performance
// Target vs achievement — joins secondary_sales with mr_targets
// ─────────────────────────────────────────────────────────────────────────────
router.get('/performance', async (req, res) => {
  try {
    const { user_id, period } = req.query;
    const conditions = ['t.org_id = $1'];
    const params = [req.org_id];

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

    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows } = await db.query(
      `SELECT
         t.user_id,
         t.period,
         p.name AS product_name,
         t.product_id,
         t.target_qty,
         t.target_value,
         COALESCE(s.actual_qty, 0) AS actual_qty,
         COALESCE(s.actual_value, 0) AS actual_value,
         CASE WHEN t.target_value > 0
           THEN ROUND((COALESCE(s.actual_value, 0) / t.target_value) * 100, 1)
           ELSE 0 END AS achievement_pct
       FROM mr_targets t
       JOIN products p ON p.id = t.product_id AND p.org_id = t.org_id
       LEFT JOIN (
         SELECT org_id, user_id, product_id, to_char(sale_date, 'YYYY-MM') AS period,
                SUM(quantity) AS actual_qty, SUM(value) AS actual_value
         FROM secondary_sales
         GROUP BY org_id, user_id, product_id, to_char(sale_date, 'YYYY-MM')
       ) s ON s.org_id = t.org_id AND s.user_id = t.user_id AND s.product_id = t.product_id AND s.period = t.period
       ${where}
       ORDER BY t.period DESC, t.user_id, p.name`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Sales] performance error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sales/growth
// Month-over-month growth trends
// ─────────────────────────────────────────────────────────────────────────────
router.get('/growth', async (req, res) => {
  try {
    const { user_id } = req.query;
    const conditions = ['org_id = $1'];
    const params = [req.org_id];

    if (req.user.role === 'mr') {
      params.push(req.user.user_id);
      conditions.push(`user_id = $${params.length}`);
    } else if (user_id) {
      params.push(user_id);
      conditions.push(`user_id = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows } = await db.query(
      `WITH monthly AS (
         SELECT
           user_id,
           to_char(sale_date, 'YYYY-MM') AS period,
           SUM(value) AS total_value,
           SUM(quantity) AS total_qty
         FROM secondary_sales
         ${where}
         GROUP BY user_id, to_char(sale_date, 'YYYY-MM')
       )
       SELECT
         m.user_id,
         m.period,
         m.total_value,
         m.total_qty,
         LAG(m.total_value) OVER (PARTITION BY m.user_id ORDER BY m.period) AS prev_value,
         CASE WHEN LAG(m.total_value) OVER (PARTITION BY m.user_id ORDER BY m.period) > 0
           THEN ROUND(((m.total_value - LAG(m.total_value) OVER (PARTITION BY m.user_id ORDER BY m.period))
                 / LAG(m.total_value) OVER (PARTITION BY m.user_id ORDER BY m.period)) * 100, 1)
           ELSE NULL END AS growth_pct
       FROM monthly m
       ORDER BY m.user_id, m.period`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Sales] growth error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sales/activity-productivity
// Joins sales data with DCR data
// ─────────────────────────────────────────────────────────────────────────────
router.get('/activity-productivity', async (req, res) => {
  try {
    const { user_id, period } = req.query;

    // $1 is always org_id; $2 is user_id (if filtering); $3 is period (if filtering)
    const params = [req.org_id];
    const orgFilter = `org_id = $1`;

    let userFilter = '';
    let userParam = null;
    if (req.user.role === 'mr') {
      params.push(req.user.user_id);
      userParam = params.length;
      userFilter = `AND user_id = $${userParam}`;
    } else if (user_id) {
      params.push(user_id);
      userParam = params.length;
      userFilter = `AND user_id = $${userParam}`;
    }

    let periodParam = null;
    if (period) {
      params.push(period);
      periodParam = params.length;
    }

    const whereSales = `WHERE ${orgFilter} ${userFilter} ${periodParam ? `AND to_char(sale_date, 'YYYY-MM') = $${periodParam}` : ''}`;
    const whereDcr = `WHERE ${orgFilter} ${userFilter} ${periodParam ? `AND to_char(date, 'YYYY-MM') = $${periodParam}` : ''}`;
    const whereTargets = `WHERE ${orgFilter} ${userFilter} ${periodParam ? `AND period = $${periodParam}` : ''}`;
    const whereUsers = `WHERE ${orgFilter} AND u.role = 'mr' ${userParam ? `AND u.user_id = $${userParam}` : ''}`;

    const { rows } = await db.query(
      `WITH sales_agg AS (
         SELECT user_id,
                SUM(value) AS total_sales,
                SUM(quantity) AS total_qty
         FROM secondary_sales
         ${whereSales}
         GROUP BY user_id
       ),
       target_agg AS (
         SELECT user_id,
                SUM(target_value) AS total_target
         FROM mr_targets
         ${whereTargets}
         GROUP BY user_id
       ),
       dcr_agg AS (
         SELECT user_id,
                COUNT(*) AS total_calls,
                COUNT(DISTINCT name) AS doctors_covered
         FROM dcr
         ${whereDcr}
         GROUP BY user_id
       ),
       doctor_count AS (
         SELECT territory, COUNT(*) AS total_doctors
         FROM doctor_profiles
         WHERE ${orgFilter}
         GROUP BY territory
       )
       SELECT
         u.user_id,
         u.name,
         u.territory,
         COALESCE(s.total_sales, 0) AS total_sales,
         COALESCE(s.total_qty, 0) AS total_qty,
         COALESCE(t.total_target, 0) AS total_target,
         CASE WHEN COALESCE(t.total_target, 0) > 0
           THEN ROUND((COALESCE(s.total_sales, 0) / t.total_target) * 100, 1)
           ELSE 0 END AS achievement_pct,
         COALESCE(d.total_calls, 0) AS total_calls,
         COALESCE(d.doctors_covered, 0) AS doctors_covered,
         COALESCE(dc.total_doctors, 0) AS total_doctors,
         CASE WHEN COALESCE(dc.total_doctors, 0) > 0
           THEN ROUND((COALESCE(d.doctors_covered, 0)::numeric / dc.total_doctors) * 100, 1)
           ELSE 0 END AS coverage_pct
       FROM users u
       LEFT JOIN sales_agg s ON s.user_id = u.user_id
       LEFT JOIN target_agg t ON t.user_id = u.user_id
       LEFT JOIN dcr_agg d ON d.user_id = u.user_id
       LEFT JOIN doctor_count dc ON dc.territory = u.territory
       ${whereUsers.replace('org_id', 'u.org_id')}
       ORDER BY u.name`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Sales] activity-productivity error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sales/export
// Export sales as CSV
// ─────────────────────────────────────────────────────────────────────────────
router.get('/export', async (req, res) => {
  try {
    const { user_id, from_date, to_date } = req.query;
    const conditions = ['ss.org_id = $1'];
    const params = [req.org_id];

    if (req.user.role === 'mr') {
      params.push(req.user.user_id);
      conditions.push(`ss.user_id = $${params.length}`);
    } else if (user_id) {
      params.push(user_id);
      conditions.push(`ss.user_id = $${params.length}`);
    }
    if (from_date) {
      params.push(from_date);
      conditions.push(`ss.sale_date >= $${params.length}`);
    }
    if (to_date) {
      params.push(to_date);
      conditions.push(`ss.sale_date <= $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows } = await db.query(
      `SELECT ss.user_id, ss.territory, d.name AS distributor, p.name AS product,
              ss.sale_date, ss.quantity, ss.value, ss.batch_number, ss.notes
       FROM secondary_sales ss
       JOIN products p ON p.id = ss.product_id AND p.org_id = ss.org_id
       LEFT JOIN distributors d ON d.id = ss.distributor_id AND d.org_id = ss.org_id
       ${where}
       ORDER BY ss.sale_date DESC`,
      params
    );

    const header = 'MR ID,Territory,Distributor,Product,Date,Quantity,Value,Batch Number,Notes\n';
    const csv = header + rows.map(r =>
      `${r.user_id},${r.territory},"${r.distributor || ''}","${r.product}",${r.sale_date},${r.quantity},${r.value},"${r.batch_number || ''}","${(r.notes || '').replace(/"/g, '""')}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_export.csv');
    res.send(csv);
  } catch (err) {
    console.error('[Sales] export error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sales/template/sales
// Download blank CSV template for sales upload
// ─────────────────────────────────────────────────────────────────────────────
router.get('/template/sales', requireRole('manager', 'admin'), (req, res) => {
  const csv = 'MR User ID,Product Name,Distributor Code,Sale Date (YYYY-MM-DD),Quantity,Value,Batch Number,Notes\n' +
              'mr_rahul_001,Derise 10mg,DIST-MN-001,2026-03-15,100,800.00,BATCH001,Sample entry\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=sales_upload_template.csv');
  res.send(csv);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sales/execution-scorecard
// Overdue tasks, doctor coverage health, market share — for dashboard
// ─────────────────────────────────────────────────────────────────────────────
router.get('/execution-scorecard', async (req, res) => {
  try {
    const isManager = req.user.role === 'manager' || req.user.role === 'admin';
    const userFilter = isManager ? null : req.user.user_id;

    // $1 = org_id always; $2 = user_id when filtering
    const baseParams = [req.org_id];
    if (userFilter) baseParams.push(userFilter);
    const userClause = userFilter ? `AND ft.user_id = $2` : '';
    const userClauseDcr = userFilter ? `AND user_id = $2` : '';
    const userClauseRcpa = userFilter ? `AND user_id = $2` : '';

    const [overdueResult, coverageResult, marketShareResult] = await Promise.all([
      // 1. Overdue follow-up tasks per MR
      db.query(
        `SELECT ft.user_id, u.name, COUNT(*) AS count
         FROM follow_up_tasks ft
         JOIN users u ON u.user_id = ft.user_id AND u.org_id = ft.org_id
         WHERE ft.status = 'overdue'
           AND ft.org_id = $1
           ${userClause}
         GROUP BY ft.user_id, u.name
         ORDER BY count DESC`,
        baseParams
      ),

      // 2. Doctor coverage: cold (30+ days), at-risk (15-29), healthy (<15)
      db.query(
        `SELECT sub.user_id, u.name,
           COUNT(*) FILTER (WHERE sub.days_since >= 30) AS cold,
           COUNT(*) FILTER (WHERE sub.days_since >= 15 AND sub.days_since < 30) AS at_risk,
           COUNT(*) FILTER (WHERE sub.days_since < 15) AS healthy
         FROM (
           SELECT org_id, user_id, name AS doctor_name, (CURRENT_DATE - MAX(date)) AS days_since
           FROM dcr
           WHERE org_id = $1 ${userClauseDcr}
           GROUP BY org_id, user_id, name
         ) sub
         JOIN users u ON u.user_id = sub.user_id AND u.org_id = sub.org_id
         GROUP BY sub.user_id, u.name
         ORDER BY cold DESC`,
        baseParams
      ),

      // 3. RCPA market share
      db.query(
        `SELECT
           COALESCE(SUM(our_value), 0) AS our_total,
           COALESCE(SUM(competitor_value), 0) AS competitor_total,
           CASE WHEN COALESCE(SUM(our_value), 0) + COALESCE(SUM(competitor_value), 0) > 0
             THEN ROUND(SUM(our_value) * 100.0 / (SUM(our_value) + SUM(competitor_value)), 1)
             ELSE 0 END AS share_pct
         FROM rcpa
         WHERE org_id = $1 ${userClauseRcpa}`,
        baseParams
      )
    ]);

    const overdueByMr = overdueResult.rows.map(r => ({
      user_id: r.user_id, name: r.name, count: parseInt(r.count)
    }));
    const overdueTotal = overdueByMr.reduce((s, r) => s + r.count, 0);

    const coverageByMr = coverageResult.rows.map(r => ({
      user_id: r.user_id, name: r.name,
      cold: parseInt(r.cold), atRisk: parseInt(r.at_risk), healthy: parseInt(r.healthy)
    }));
    const coverageTotals = coverageByMr.reduce(
      (acc, r) => ({ cold: acc.cold + r.cold, atRisk: acc.atRisk + r.atRisk, healthy: acc.healthy + r.healthy }),
      { cold: 0, atRisk: 0, healthy: 0 }
    );

    const ms = marketShareResult.rows[0];

    res.json({
      success: true,
      data: {
        overdueTasks: { total: overdueTotal, byMr: overdueByMr },
        coverage: {
          ...coverageTotals,
          total: coverageTotals.cold + coverageTotals.atRisk + coverageTotals.healthy,
          byMr: coverageByMr
        },
        marketShare: {
          ourValue: parseFloat(ms.our_total),
          competitorValue: parseFloat(ms.competitor_total),
          sharePct: parseFloat(ms.share_pct)
        }
      }
    });
  } catch (err) {
    console.error('[Sales] execution-scorecard error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sales
// List sales records with filters
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { user_id, from_date, to_date, product_id, period } = req.query;
    const conditions = ['ss.org_id = $1'];
    const params = [req.org_id];

    // MRs see only their own data
    if (req.user.role === 'mr') {
      params.push(req.user.user_id);
      conditions.push(`ss.user_id = $${params.length}`);
    } else if (user_id) {
      params.push(user_id);
      conditions.push(`ss.user_id = $${params.length}`);
    }

    if (from_date) {
      params.push(from_date);
      conditions.push(`ss.sale_date >= $${params.length}`);
    }
    if (to_date) {
      params.push(to_date);
      conditions.push(`ss.sale_date <= $${params.length}`);
    }
    if (product_id) {
      params.push(product_id);
      conditions.push(`ss.product_id = $${params.length}`);
    }
    if (period) {
      params.push(period);
      conditions.push(`to_char(ss.sale_date, 'YYYY-MM') = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows } = await db.query(
      `SELECT ss.*, p.name AS product_name, d.name AS distributor_name, d.code AS distributor_code
       FROM secondary_sales ss
       JOIN products p ON p.id = ss.product_id AND p.org_id = ss.org_id
       LEFT JOIN distributors d ON d.id = ss.distributor_id AND d.org_id = ss.org_id
       ${where}
       ORDER BY ss.sale_date DESC, ss.id DESC
       LIMIT 1000`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Sales] fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sales
// Create a single sales record (manager/admin only)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { user_id, distributor_id, product_id, sale_date, quantity, value, batch_number, notes } = req.body;

    if (!user_id || !product_id || !sale_date || !quantity || value === undefined) {
      return res.status(400).json({ error: 'user_id, product_id, sale_date, quantity, and value are required' });
    }

    // Look up MR's territory (must be in same org)
    const { rows: userRows } = await db.query(
      'SELECT territory FROM users WHERE user_id = $1 AND org_id = $2',
      [user_id, req.org_id]
    );
    if (!userRows.length) {
      return res.status(400).json({ error: `MR with user_id '${user_id}' not found` });
    }
    const territory = userRows[0].territory;

    const { rows } = await db.query(
      `INSERT INTO secondary_sales (org_id, user_id, territory, distributor_id, product_id, sale_date, quantity, value, batch_number, notes, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [req.org_id, user_id, territory, distributor_id || null, product_id, sale_date, quantity, value, batch_number || null, notes || null, req.user.user_id]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Sales] create error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/sales/:id
// Update a sales record (manager/admin only)
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { distributor_id, product_id, sale_date, quantity, value, batch_number, notes } = req.body;

    const fields = [];
    const params = [];

    if (distributor_id !== undefined) { params.push(distributor_id); fields.push(`distributor_id = $${params.length}`); }
    if (product_id !== undefined) { params.push(product_id); fields.push(`product_id = $${params.length}`); }
    if (sale_date !== undefined) { params.push(sale_date); fields.push(`sale_date = $${params.length}`); }
    if (quantity !== undefined) { params.push(quantity); fields.push(`quantity = $${params.length}`); }
    if (value !== undefined) { params.push(value); fields.push(`value = $${params.length}`); }
    if (batch_number !== undefined) { params.push(batch_number); fields.push(`batch_number = $${params.length}`); }
    if (notes !== undefined) { params.push(notes); fields.push(`notes = $${params.length}`); }

    if (!fields.length) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    fields.push(`updated_at = NOW()`);
    params.push(id);
    params.push(req.org_id);

    const { rows } = await db.query(
      `UPDATE secondary_sales SET ${fields.join(', ')}
       WHERE id = $${params.length - 1} AND org_id = $${params.length}
       RETURNING *`,
      params
    );

    if (!rows.length) return res.status(404).json({ error: 'Sale record not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Sales] update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/sales/:id
// Delete a sales record (manager/admin only)
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      'DELETE FROM secondary_sales WHERE id = $1 AND org_id = $2 RETURNING id',
      [req.params.id, req.org_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Sale record not found' });
    res.json({ success: true, deleted: rows[0].id });
  } catch (err) {
    console.error('[Sales] delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sales/upload
// Bulk upload CSV/Excel (manager/admin only)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/upload', requireRole('manager', 'admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows.length) return res.status(400).json({ error: 'File is empty' });
    if (rows.length > 5000) return res.status(400).json({ error: 'Maximum 5000 rows per upload' });

    // Preload products and distributors for matching (org-scoped)
    const { rows: products } = await db.query(
      'SELECT id, name FROM products WHERE org_id = $1',
      [req.org_id]
    );
    const productMap = {};
    products.forEach(p => { productMap[p.name.toLowerCase().trim()] = p.id; });

    const { rows: distributors } = await db.query(
      'SELECT id, code, territory FROM distributors WHERE org_id = $1',
      [req.org_id]
    );
    const distMap = {};
    distributors.forEach(d => { if (d.code) distMap[d.code.toLowerCase().trim()] = d; });

    // Preload user territories
    const { rows: users } = await db.query(
      "SELECT user_id, territory FROM users WHERE role = 'mr' AND org_id = $1",
      [req.org_id]
    );
    const userTerritoryMap = {};
    users.forEach(u => { userTerritoryMap[u.user_id] = u.territory; });

    const batchId = `upload_${Date.now()}`;
    const inserted = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // header is row 1

      const mrUserId = (row['MR User ID'] || '').toString().trim();
      const productName = (row['Product Name'] || '').toString().trim();
      const distCode = (row['Distributor Code'] || '').toString().trim();
      const saleDate = (row['Sale Date (YYYY-MM-DD)'] || row['Sale Date'] || '').toString().trim();
      const qty = parseInt(row['Quantity'], 10);
      const val = parseFloat(row['Value']);
      const batchNum = (row['Batch Number'] || '').toString().trim() || null;
      const notes = (row['Notes'] || '').toString().trim() || null;

      // Validate required fields
      if (!mrUserId) { errors.push({ row: rowNum, message: 'Missing MR User ID' }); continue; }
      if (!productName) { errors.push({ row: rowNum, message: 'Missing Product Name' }); continue; }
      if (!saleDate) { errors.push({ row: rowNum, message: 'Missing Sale Date' }); continue; }
      if (isNaN(qty) || qty <= 0) { errors.push({ row: rowNum, message: 'Invalid Quantity (must be positive integer)' }); continue; }
      if (isNaN(val) || val < 0) { errors.push({ row: rowNum, message: 'Invalid Value' }); continue; }

      // Match product
      const productId = productMap[productName.toLowerCase()];
      if (!productId) { errors.push({ row: rowNum, message: `Unknown product: '${productName}'` }); continue; }

      // Match MR territory
      const territory = userTerritoryMap[mrUserId];
      if (!territory) { errors.push({ row: rowNum, message: `Unknown MR: '${mrUserId}'` }); continue; }

      // Match distributor (optional)
      let distributorId = null;
      if (distCode) {
        const dist = distMap[distCode.toLowerCase()];
        if (!dist) { errors.push({ row: rowNum, message: `Unknown distributor code: '${distCode}'` }); continue; }
        distributorId = dist.id;
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(saleDate)) {
        errors.push({ row: rowNum, message: `Invalid date format: '${saleDate}' (use YYYY-MM-DD)` });
        continue;
      }

      try {
        const { rows: insertedRows } = await db.query(
          `INSERT INTO secondary_sales (org_id, user_id, territory, distributor_id, product_id, sale_date, quantity, value, batch_number, notes, uploaded_by, upload_batch_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING id`,
          [req.org_id, mrUserId, territory, distributorId, productId, saleDate, qty, val, batchNum, notes, req.user.user_id, batchId]
        );
        inserted.push(insertedRows[0].id);
      } catch (dbErr) {
        errors.push({ row: rowNum, message: dbErr.message });
      }
    }

    res.json({
      success: true,
      upload_batch_id: batchId,
      inserted: inserted.length,
      errors: errors,
      total_rows: rows.length
    });
  } catch (err) {
    console.error('[Sales] upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
