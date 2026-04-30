/**
 * middleware/auditLog.js
 *
 * The Phase C.1 compliance ledger. Provides a single helper `recordAudit()`
 * that routes call explicitly on CREATE/UPDATE/DELETE of regulated rows.
 *
 * Why explicit (not a Postgres trigger / not Express middleware that
 * intercepts every response):
 *   - Triggers can't see the JWT user / route path / IP — they only see
 *     `current_user` which is the DB user. Compliance officers need the
 *     application-level actor.
 *   - A blanket Express middleware that diffs request bodies would
 *     double-count (e.g., a single PATCH that touches 3 rows = 1 audit
 *     entry for the request, not 3 for the rows). We want one row per
 *     domain change, not per HTTP request.
 *   - Routes already touch the DB inline; passing `before`/`after` snapshots
 *     to recordAudit() at the same place is the cleanest signal that this
 *     change is regulated.
 *
 * Fire-and-forget by default — never throws to the caller. A failed audit
 * write is logged loudly but does not roll back the user-facing operation.
 * Compliance officers can detect gaps by counting per-table audit volume
 * over time; failing silently here is preferable to bricking a write path.
 *
 * Usage from a route:
 *   const { recordAudit } = require('../middleware/auditLog');
 *   // ... after the INSERT/UPDATE/DELETE in the route handler
 *   recordAudit({
 *     req,
 *     action: 'CREATE',          // 'CREATE' | 'UPDATE' | 'DELETE'
 *     tableName: 'consent_records',
 *     rowId: created.id,
 *     before: null,              // null for CREATE
 *     after: created,            // null for DELETE
 *     reason: 'Initial consent capture'  // optional
 *   });
 *
 * If `req` carries the JWT user (it does after authenticateToken), the
 * actor is auto-populated. Pass `actorOverride: { user_id, role }` for
 * system-driven writes (cron jobs, async services).
 */

const db = require('../config/db');

/**
 * Tables we audit. Used by the read API (/api/audit) to filter and by the
 * Compliance Inbox UI to surface "what's regulated". Keep in sync as new
 * regulated entities are added.
 */
const REGULATED_TABLES = [
  // Phase A/B regulated records
  'dcr',
  'doctor_profiles',
  'doctor_requests',
  'adverse_events',
  'sample_movements',
  'sample_stock',
  'expense_claims',
  'orders',
  'leaves',
  'tour_plans',
  // Phase B content/MLR
  'content_assets',
  'content_versions',
  'mlr_reviews',
  'content_distributions',
  // Phase C.1 itself
  'consent_records',
  'regulatory_documents',
  'regulatory_document_versions',
  'compliance_findings',
];

/**
 * Records a single audit event. Never throws.
 *
 * @param {object} opts
 * @param {object} opts.req - Express request (for actor + IP + route)
 * @param {string} opts.action - 'CREATE' | 'UPDATE' | 'DELETE'
 * @param {string} opts.tableName
 * @param {string|number} opts.rowId
 * @param {object|null} [opts.before]
 * @param {object|null} [opts.after]
 * @param {string} [opts.reason]
 * @param {object} [opts.actorOverride] - { user_id, role } for system writes
 */
async function recordAudit(opts) {
  const {
    req,
    action,
    tableName,
    rowId,
    before = null,
    after = null,
    reason = null,
    actorOverride = null,
  } = opts || {};

  try {
    if (!action || !tableName || rowId === undefined || rowId === null) {
      console.warn('[AUDIT] skipped: missing required field', { action, tableName, rowId });
      return;
    }

    const orgId = (req && req.org_id) || '00000000-0000-0000-0000-000000000001';
    const actor = actorOverride
      || (req && req.user ? { user_id: req.user.user_id, role: req.user.role } : { user_id: null, role: null });

    // The audit row is ALWAYS written under the org_id of the affected record.
    // For request-scoped writes, that's req.org_id. For system writes, the
    // caller should pass the affected row's org_id explicitly via actorOverride
    // — TODO: extend signature when first system writer needs it.

    await db.query(
      `INSERT INTO audit_log
        (org_id, actor_user_id, actor_role, table_name, row_id, action,
         before_data, after_data, route_path, http_method, ip_address, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        orgId,
        actor.user_id || null,
        actor.role || null,
        tableName,
        String(rowId),
        action,
        before ? JSON.stringify(before) : null,
        after ? JSON.stringify(after) : null,
        req && req.originalUrl ? req.originalUrl.slice(0, 255) : null,
        req && req.method ? req.method : null,
        extractIp(req),
        reason,
      ]
    );
  } catch (err) {
    // Never bubble — but make this loud in logs so a missing audit trail
    // shows up in monitoring.
    console.error(`[AUDIT] FAILED to record ${action} on ${tableName}#${rowId}:`, err.message);
  }
}

function extractIp(req) {
  if (!req) return null;
  const xff = req.headers && req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim().slice(0, 64);
  return (req.ip || (req.connection && req.connection.remoteAddress) || null);
}

module.exports = {
  recordAudit,
  REGULATED_TABLES,
};
