const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');

const VALID_TOUR_TYPES = ['field_work', 'meeting', 'training', 'conference', 'other'];
const VALID_VISIT_STATUSES = ['planned', 'completed', 'missed', 'cancelled'];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: insert visits for a plan in a transaction.
// Caller must own the client.
// ─────────────────────────────────────────────────────────────────────────────
async function insertVisits(client, orgId, tourPlanId, visits) {
  if (!Array.isArray(visits) || visits.length === 0) return [];
  const inserted = [];
  for (let i = 0; i < visits.length; i++) {
    const v = visits[i] || {};
    const doctorName = (v.doctor_name || '').trim();
    if (!doctorName && !v.doctor_id) continue;
    const visitOrder = Number.isInteger(v.visit_order) ? v.visit_order : i + 1;
    const { rows } = await client.query(
      `INSERT INTO tour_plan_visits (org_id, tour_plan_id, doctor_id, doctor_name, visit_order, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [orgId, tourPlanId, v.doctor_id || null, doctorName || null, visitOrder, v.notes || null]
    );
    inserted.push(rows[0]);
  }
  return inserted;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tour-plans/stats — pending count for managers
// MUST be defined before /:id to avoid param capture.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT COUNT(*)::int AS pending
       FROM tour_plans
       WHERE org_id = $1 AND status = 'submitted'`,
      [req.org_id]
    );
    res.json({ success: true, stats: rows[0] });
  } catch (err) {
    console.error('[TourPlans] stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tour-plans — list plans (MRs see own, managers/admins see all in org)
// Query params: status, user_id (managers only), from_date, to_date
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
      conditions.push(`plan_date >= $${params.length}`);
    }
    if (to_date) {
      params.push(to_date);
      conditions.push(`plan_date <= $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await db.query(
      `SELECT * FROM tour_plans ${where} ORDER BY plan_date DESC, id DESC LIMIT 500`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[TourPlans] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tour-plans/:id — one plan + its visits
// MR can read own; manager/admin reads any in org
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT * FROM tour_plans WHERE id = $1 AND org_id = $2',
      [id, req.org_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Tour plan not found' });
    }
    const plan = rows[0];
    if (req.user.role === 'mr' && plan.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Cannot view another MR\'s tour plan' });
    }

    const { rows: visits } = await db.query(
      `SELECT v.*, d.specialty, d.tier, d.territory
       FROM tour_plan_visits v
       LEFT JOIN doctor_profiles d ON d.id = v.doctor_id AND d.org_id = v.org_id
       WHERE v.tour_plan_id = $1 AND v.org_id = $2
       ORDER BY v.visit_order ASC, v.id ASC`,
      [id, req.org_id]
    );
    res.json({ success: true, data: { ...plan, visits } });
  } catch (err) {
    console.error('[TourPlans] get error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tour-plans — MR creates a draft plan + visits
// Body: { plan_date, type_of_tour?, station?, start_time?, end_time?, notes?, visits: [...] }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  if (req.user.role !== 'mr' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only MRs can create tour plans' });
  }

  const { plan_date, type_of_tour, station, start_time, end_time, notes, visits } = req.body;
  if (!plan_date) {
    return res.status(400).json({ error: 'plan_date is required' });
  }
  if (type_of_tour && !VALID_TOUR_TYPES.includes(type_of_tour)) {
    return res.status(400).json({ error: `type_of_tour must be one of: ${VALID_TOUR_TYPES.join(', ')}` });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO tour_plans (org_id, user_id, plan_date, type_of_tour, station, start_time, end_time, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.org_id, req.user.user_id, plan_date, type_of_tour || 'field_work',
       station || null, start_time || null, end_time || null, notes || null]
    );
    const plan = rows[0];
    const insertedVisits = await insertVisits(client, req.org_id, plan.id, visits);

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: { ...plan, visits: insertedVisits } });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: `A tour plan already exists for ${plan_date}` });
    }
    console.error('[TourPlans] create error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tour-plans/:id — owner edits a draft plan
// Replace-all approach for visits: send the full new visits array.
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { plan_date, type_of_tour, station, start_time, end_time, notes, visits } = req.body;

  if (type_of_tour && !VALID_TOUR_TYPES.includes(type_of_tour)) {
    return res.status(400).json({ error: `type_of_tour must be one of: ${VALID_TOUR_TYPES.join(', ')}` });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the row and verify ownership + draft status
    const { rows: existing } = await client.query(
      'SELECT * FROM tour_plans WHERE id = $1 AND org_id = $2 FOR UPDATE',
      [id, req.org_id]
    );
    if (existing.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Tour plan not found' });
    }
    const plan = existing[0];
    if (plan.user_id !== req.user.user_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Cannot edit another MR\'s tour plan' });
    }
    if (plan.status !== 'draft') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `Cannot edit plan in status '${plan.status}' (only drafts are editable)` });
    }

    const fields = [];
    const params = [];
    if (plan_date !== undefined)    { params.push(plan_date);    fields.push(`plan_date = $${params.length}`); }
    if (type_of_tour !== undefined) { params.push(type_of_tour); fields.push(`type_of_tour = $${params.length}`); }
    if (station !== undefined)      { params.push(station);      fields.push(`station = $${params.length}`); }
    if (start_time !== undefined)   { params.push(start_time);   fields.push(`start_time = $${params.length}`); }
    if (end_time !== undefined)     { params.push(end_time);     fields.push(`end_time = $${params.length}`); }
    if (notes !== undefined)        { params.push(notes);        fields.push(`notes = $${params.length}`); }

    let updatedPlan = plan;
    if (fields.length > 0) {
      params.push(id, req.org_id);
      const { rows: updated } = await client.query(
        `UPDATE tour_plans SET ${fields.join(', ')}
         WHERE id = $${params.length - 1} AND org_id = $${params.length}
         RETURNING *`,
        params
      );
      updatedPlan = updated[0];
    }

    let insertedVisits;
    if (Array.isArray(visits)) {
      // Replace-all: delete existing visits and insert new
      await client.query(
        'DELETE FROM tour_plan_visits WHERE tour_plan_id = $1 AND org_id = $2',
        [id, req.org_id]
      );
      insertedVisits = await insertVisits(client, req.org_id, id, visits);
    } else {
      const { rows: existingVisits } = await client.query(
        'SELECT * FROM tour_plan_visits WHERE tour_plan_id = $1 AND org_id = $2 ORDER BY visit_order ASC',
        [id, req.org_id]
      );
      insertedVisits = existingVisits;
    }

    await client.query('COMMIT');
    res.json({ success: true, data: { ...updatedPlan, visits: insertedVisits } });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Another tour plan already exists for that date' });
    }
    console.error('[TourPlans] update error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tour-plans/:id/submit — owner submits for review
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `UPDATE tour_plans
       SET status = 'submitted', submitted_at = NOW()
       WHERE id = $1 AND org_id = $2 AND user_id = $3 AND status = 'draft'
       RETURNING *`,
      [id, req.org_id, req.user.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found, not yours, or not in draft status' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[TourPlans] submit error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tour-plans/:id/review — manager approves or rejects
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
      `UPDATE tour_plans
       SET status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4 AND org_id = $5 AND status = 'submitted'
       RETURNING *`,
      [status, review_notes || null, req.user.user_id, id, req.org_id]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Plan not found or not awaiting review' });
    }
    await client.query('COMMIT');
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[TourPlans] review error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tour-plans/visits/:visitId/status — owner marks a visit completed/missed
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/visits/:visitId/status', async (req, res) => {
  const { visitId } = req.params;
  const { status, notes } = req.body;
  if (!status || !VALID_VISIT_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Valid status required: ${VALID_VISIT_STATUSES.join(', ')}` });
  }

  try {
    // Verify the visit belongs to a plan owned by the requester
    const { rows: visit } = await db.query(
      `SELECT v.id, tp.user_id
       FROM tour_plan_visits v
       JOIN tour_plans tp ON tp.id = v.tour_plan_id AND tp.org_id = v.org_id
       WHERE v.id = $1 AND v.org_id = $2`,
      [visitId, req.org_id]
    );
    if (visit.length === 0) {
      return res.status(404).json({ error: 'Visit not found' });
    }
    if (visit[0].user_id !== req.user.user_id && req.user.role === 'mr') {
      return res.status(403).json({ error: 'Cannot update another MR\'s visit' });
    }

    const fields = ['status = $1'];
    const params = [status];
    if (notes !== undefined) {
      params.push(notes);
      fields.push(`notes = $${params.length}`);
    }
    params.push(visitId, req.org_id);
    const { rows } = await db.query(
      `UPDATE tour_plan_visits SET ${fields.join(', ')}
       WHERE id = $${params.length - 1} AND org_id = $${params.length}
       RETURNING *`,
      params
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[TourPlans] visit status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/tour-plans/:id — owner cancels a draft plan
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `DELETE FROM tour_plans
       WHERE id = $1 AND org_id = $2 AND user_id = $3 AND status = 'draft'
       RETURNING id`,
      [id, req.org_id, req.user.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found, not yours, or not in draft status' });
    }
    res.json({ success: true, deleted: rows[0].id });
  } catch (err) {
    console.error('[TourPlans] delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
