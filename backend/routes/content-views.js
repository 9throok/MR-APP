const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');

// Cap on a single batch to keep the SQL parameter list bounded.
// 200 view events per batch is more than enough — even a long visit with a
// big slide deck rarely exceeds 50 slides, and each slide is one event.
const MAX_BATCH = 200;

// ─────────────────────────────────────────────────────────────────────────────
// Validation helper for a single event payload
// ─────────────────────────────────────────────────────────────────────────────
function validateEvent(ev) {
  if (!ev || typeof ev !== 'object') return 'event must be an object';
  if (!Number.isInteger(ev.version_id) || ev.version_id <= 0) return 'version_id is required and must be a positive integer';
  if (ev.duration_seconds == null || Number.isNaN(Number(ev.duration_seconds)) || Number(ev.duration_seconds) < 0) {
    return 'duration_seconds is required and must be >= 0';
  }
  if (ev.slide_index != null && (!Number.isInteger(ev.slide_index) || ev.slide_index < 0)) {
    return 'slide_index, if provided, must be a non-negative integer';
  }
  if (ev.doctor_id != null && (!Number.isInteger(ev.doctor_id) || ev.doctor_id <= 0)) {
    return 'doctor_id, if provided, must be a positive integer';
  }
  if (ev.dcr_id != null && !(Number.isInteger(ev.dcr_id) && ev.dcr_id > 0)) {
    return 'dcr_id, if provided, must be a positive integer';
  }
  return null;
}

// Insert one or many view events in a single transaction.
async function insertEvents(client, orgId, userId, events) {
  const inserted = [];
  for (const ev of events) {
    // Validate the version belongs to the caller's org. Without this check,
    // an MR could send a view event referencing another org's version_id.
    const { rows: vCheck } = await client.query(
      'SELECT 1 FROM content_versions WHERE id = $1 AND org_id = $2',
      [ev.version_id, orgId]
    );
    if (vCheck.length === 0) {
      const err = new Error(`version_id ${ev.version_id} not found in this org`);
      err.statusCode = 404;
      throw err;
    }

    const { rows } = await client.query(
      `INSERT INTO content_views
         (org_id, version_id, user_id, doctor_id, dcr_id, slide_index, duration_seconds, viewed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::timestamptz, NOW()))
       RETURNING *`,
      [orgId, ev.version_id, userId,
       ev.doctor_id || null, ev.dcr_id || null,
       ev.slide_index == null ? null : ev.slide_index,
       Number(ev.duration_seconds),
       ev.viewed_at || null]
    );
    inserted.push(rows[0]);
  }
  return inserted;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/content-views — record a single event
// Body: { version_id, doctor_id?, dcr_id?, slide_index?, duration_seconds, viewed_at? }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  if (req.user.role !== 'mr' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only MRs can record content views' });
  }
  const err = validateEvent(req.body);
  if (err) return res.status(400).json({ error: err });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = await insertEvents(client, req.org_id, req.user.user_id, [req.body]);
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: inserted[0] });
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.statusCode) return res.status(e.statusCode).json({ error: e.message });
    console.error('[ContentViews] single insert error:', e.message);
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/content-views/batch — record many events in one request
// Body: { events: [{...}, {...}, ...] }
//
// This is what the EDetailing.tsx client flushes when the MR closes a session
// — many slide-view events queued in memory, sent in one round-trip.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/batch', async (req, res) => {
  if (req.user.role !== 'mr' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only MRs can record content views' });
  }
  const { events } = req.body;
  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'events array is required and must not be empty' });
  }
  if (events.length > MAX_BATCH) {
    return res.status(400).json({ error: `Maximum ${MAX_BATCH} events per batch` });
  }
  // Pre-validate every event before opening the transaction so we fail fast.
  for (let i = 0; i < events.length; i++) {
    const err = validateEvent(events[i]);
    if (err) return res.status(400).json({ error: `events[${i}]: ${err}` });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = await insertEvents(client, req.org_id, req.user.user_id, events);
    await client.query('COMMIT');
    res.status(201).json({ success: true, count: inserted.length, data: inserted });
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.statusCode) return res.status(e.statusCode).json({ error: e.message });
    console.error('[ContentViews] batch insert error:', e.message);
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/content-views/analytics — aggregated views (admin/manager dashboard)
// Returns several summaries in one response so the client can render a
// dashboard without round-tripping for each card. Filters: ?from_date,
// ?to_date, ?asset_id, ?user_id.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/analytics', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { from_date, to_date, asset_id, user_id } = req.query;
    const conditions = ['cv.org_id = $1'];
    const params = [req.org_id];

    if (from_date) {
      params.push(from_date);
      conditions.push(`cv.viewed_at >= $${params.length}`);
    }
    if (to_date) {
      params.push(to_date);
      conditions.push(`cv.viewed_at <= $${params.length}`);
    }
    if (asset_id) {
      params.push(asset_id);
      conditions.push(`a.id = $${params.length}`);
    }
    if (user_id) {
      params.push(user_id);
      conditions.push(`cv.user_id = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    // Run the aggregate queries in parallel — they share filter params.
    const [byAsset, byMr, byDoctor, totals] = await Promise.all([
      // Top assets by total view time
      db.query(
        `SELECT a.id AS asset_id, a.title, a.asset_type,
                COUNT(*)::int                       AS view_events,
                COUNT(DISTINCT cv.user_id)::int      AS unique_mrs,
                COUNT(DISTINCT cv.doctor_id)::int    AS unique_doctors,
                ROUND(SUM(cv.duration_seconds)::numeric, 1) AS total_seconds,
                ROUND(AVG(cv.duration_seconds)::numeric, 1) AS avg_seconds_per_event
         FROM content_views cv
         JOIN content_versions v ON v.id = cv.version_id AND v.org_id = cv.org_id
         JOIN content_assets a   ON a.id = v.asset_id   AND a.org_id = v.org_id
         ${where}
         GROUP BY a.id, a.title, a.asset_type
         ORDER BY total_seconds DESC NULLS LAST
         LIMIT 50`,
        params
      ),
      // Top MRs by usage
      db.query(
        `SELECT cv.user_id, u.name AS mr_name,
                COUNT(*)::int                    AS view_events,
                COUNT(DISTINCT v.asset_id)::int   AS unique_assets,
                COUNT(DISTINCT cv.doctor_id)::int AS unique_doctors,
                ROUND(SUM(cv.duration_seconds)::numeric, 1) AS total_seconds
         FROM content_views cv
         JOIN content_versions v ON v.id = cv.version_id AND v.org_id = cv.org_id
         JOIN content_assets a   ON a.id = v.asset_id   AND a.org_id = v.org_id
         LEFT JOIN users u       ON u.user_id = cv.user_id AND u.org_id = cv.org_id
         ${where}
         GROUP BY cv.user_id, u.name
         ORDER BY total_seconds DESC NULLS LAST
         LIMIT 50`,
        params
      ),
      // Top doctors by content engagement
      db.query(
        `SELECT cv.doctor_id, d.name AS doctor_name, d.specialty,
                COUNT(*)::int                    AS view_events,
                COUNT(DISTINCT v.asset_id)::int   AS unique_assets,
                ROUND(SUM(cv.duration_seconds)::numeric, 1) AS total_seconds
         FROM content_views cv
         JOIN content_versions v ON v.id = cv.version_id AND v.org_id = cv.org_id
         JOIN content_assets a   ON a.id = v.asset_id   AND a.org_id = v.org_id
         LEFT JOIN doctor_profiles d ON d.id = cv.doctor_id AND d.org_id = cv.org_id
         ${where} AND cv.doctor_id IS NOT NULL
         GROUP BY cv.doctor_id, d.name, d.specialty
         ORDER BY total_seconds DESC NULLS LAST
         LIMIT 50`,
        params
      ),
      // Org-wide totals
      db.query(
        `SELECT COUNT(*)::int                   AS total_events,
                COUNT(DISTINCT v.asset_id)::int  AS distinct_assets,
                COUNT(DISTINCT cv.user_id)::int   AS distinct_mrs,
                COUNT(DISTINCT cv.doctor_id) FILTER (WHERE cv.doctor_id IS NOT NULL)::int AS distinct_doctors,
                ROUND(SUM(cv.duration_seconds)::numeric, 1) AS total_seconds
         FROM content_views cv
         JOIN content_versions v ON v.id = cv.version_id AND v.org_id = cv.org_id
         JOIN content_assets a   ON a.id = v.asset_id   AND a.org_id = v.org_id
         ${where}`,
        params
      )
    ]);

    res.json({
      success: true,
      data: {
        totals: totals.rows[0] || {},
        by_asset: byAsset.rows,
        by_mr: byMr.rows,
        by_doctor: byDoctor.rows
      }
    });
  } catch (err) {
    console.error('[ContentViews] analytics error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/content-views — list events (MR sees own, admin/manager sees all)
// Filters: ?version_id, ?user_id (manager only), ?doctor_id, ?from_date, ?to_date
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { version_id, user_id, doctor_id, from_date, to_date } = req.query;
    const conditions = ['org_id = $1'];
    const params = [req.org_id];

    if (req.user.role === 'mr') {
      params.push(req.user.user_id);
      conditions.push(`user_id = $${params.length}`);
    } else if (user_id) {
      params.push(user_id);
      conditions.push(`user_id = $${params.length}`);
    }
    if (version_id) {
      params.push(version_id);
      conditions.push(`version_id = $${params.length}`);
    }
    if (doctor_id) {
      params.push(doctor_id);
      conditions.push(`doctor_id = $${params.length}`);
    }
    if (from_date) {
      params.push(from_date);
      conditions.push(`viewed_at >= $${params.length}`);
    }
    if (to_date) {
      params.push(to_date);
      conditions.push(`viewed_at <= $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await db.query(
      `SELECT * FROM content_views ${where}
       ORDER BY viewed_at DESC, id DESC LIMIT 500`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[ContentViews] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
