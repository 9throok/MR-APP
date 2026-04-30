/**
 * routes/audit.js — Phase C.1
 *
 * Read-only admin/compliance-officer surface over `audit_log`. The middleware
 * in middleware/auditLog.js writes; this route lets a human investigator
 * scroll the trail.
 *
 * All endpoints require admin role.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');
const { REGULATED_TABLES } = require('../middleware/auditLog');

// Everyone here must be admin or manager. Manager is allowed read-only
// because compliance officers are typically not the system admin.
const requireAuditAccess = requireRole('admin', 'manager');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/audit/regulated-tables — what we audit (helps the UI build filters)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/regulated-tables', requireAuditAccess, (req, res) => {
  res.json({ success: true, data: REGULATED_TABLES });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/audit — paginated audit feed with filters
// Query: ?table=&actor=&action=&from=&to=&limit=&offset=
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', requireAuditAccess, async (req, res) => {
  try {
    const {
      table, actor, action, from, to,
      limit = 100, offset = 0,
    } = req.query;

    const params = [req.org_id];
    const where = ['org_id = $1'];

    if (table)  { params.push(table);  where.push(`table_name = $${params.length}`); }
    if (actor)  { params.push(actor);  where.push(`actor_user_id = $${params.length}`); }
    if (action) { params.push(action); where.push(`action = $${params.length}`); }
    if (from)   { params.push(from);   where.push(`occurred_at >= $${params.length}`); }
    if (to)     { params.push(to);     where.push(`occurred_at <= $${params.length}`); }

    const cappedLimit = Math.min(parseInt(limit, 10) || 100, 500);
    params.push(cappedLimit);
    params.push(parseInt(offset, 10) || 0);

    const { rows } = await db.query(
      `SELECT id, occurred_at, actor_user_id, actor_role, table_name, row_id,
              action, before_data, after_data, route_path, http_method,
              ip_address, reason
       FROM audit_log
       WHERE ${where.join(' AND ')}
       ORDER BY occurred_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    console.error('[AUDIT] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/audit/row/:table/:rowId — full history of one record
// (the "show me everything that happened to this DCR" view)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/row/:table/:rowId', requireAuditAccess, async (req, res) => {
  try {
    const { table, rowId } = req.params;
    const { rows } = await db.query(
      `SELECT id, occurred_at, actor_user_id, actor_role, action,
              before_data, after_data, route_path, http_method, reason
       FROM audit_log
       WHERE org_id = $1 AND table_name = $2 AND row_id = $3
       ORDER BY occurred_at ASC`,
      [req.org_id, table, rowId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[AUDIT] row history error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/audit/stats — high-level dashboard counters (last 30 days)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', requireAuditAccess, async (req, res) => {
  try {
    const { rows: byTable } = await db.query(
      `SELECT table_name,
              COUNT(*)::int                                  AS total,
              COUNT(*) FILTER (WHERE action='CREATE')::int   AS creates,
              COUNT(*) FILTER (WHERE action='UPDATE')::int   AS updates,
              COUNT(*) FILTER (WHERE action='DELETE')::int   AS deletes
       FROM audit_log
       WHERE org_id = $1 AND occurred_at >= NOW() - INTERVAL '30 days'
       GROUP BY table_name
       ORDER BY total DESC`,
      [req.org_id]
    );

    const { rows: byActor } = await db.query(
      `SELECT actor_user_id, actor_role, COUNT(*)::int AS total
       FROM audit_log
       WHERE org_id = $1
         AND occurred_at >= NOW() - INTERVAL '30 days'
         AND actor_user_id IS NOT NULL
       GROUP BY actor_user_id, actor_role
       ORDER BY total DESC
       LIMIT 25`,
      [req.org_id]
    );

    res.json({ success: true, data: { byTable, byActor } });
  } catch (err) {
    console.error('[AUDIT] stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
