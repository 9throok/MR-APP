/**
 * routes/affiliations.js — Phase C.3
 *
 * Doctor ↔ institution mapping. A doctor may practice at multiple sites; an
 * institution has many affiliated doctors. Time-bounded: each row has
 * effective_from / effective_until. Closing one and re-opening with a new
 * effective_from is the supported way to record a role change.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/auditLog');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/affiliations — list with filters
// Query: ?doctor_id=&institution_id=&active=true
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { doctor_id, institution_id, active } = req.query;
    const params = [req.org_id];
    const where = ['a.org_id = $1'];

    if (doctor_id)      { params.push(doctor_id);      where.push(`a.doctor_id = $${params.length}`); }
    if (institution_id) { params.push(institution_id); where.push(`a.institution_id = $${params.length}`); }
    if (active === 'true') { where.push(`a.effective_until IS NULL`); }

    const { rows } = await db.query(
      `SELECT a.*,
              d.name AS doctor_name, d.specialty AS doctor_specialty, d.specialty_code, d.tier AS doctor_tier,
              i.name AS institution_name, i.institution_type, i.city, i.territory AS institution_territory
       FROM hcp_affiliations a
       JOIN doctor_profiles d ON d.id = a.doctor_id AND d.org_id = a.org_id
       JOIN institutions i    ON i.id = a.institution_id AND i.org_id = a.org_id
       WHERE ${where.join(' AND ')}
       ORDER BY a.effective_until IS NULL DESC, a.effective_from DESC
       LIMIT 500`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[AFFIL] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/affiliations — create a new affiliation
// Body: { doctor_id, institution_id, role?, department?, is_primary?,
//         effective_from?, effective_until?, notes? }
//
// If is_primary=true, transactionally clears the is_primary flag from any
// other active affiliations for the same doctor — a doctor has at most one
// primary practice site at a time.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', requireRole('admin', 'manager', 'mr'), async (req, res) => {
  const {
    doctor_id, institution_id, role, department,
    is_primary, effective_from, effective_until, notes,
  } = req.body;

  if (!doctor_id || !institution_id) {
    return res.status(400).json({ error: 'doctor_id and institution_id are required' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Confirm both ends exist in this org
    const { rowCount: dExists } = await client.query(
      `SELECT 1 FROM doctor_profiles WHERE id = $1 AND org_id = $2`,
      [doctor_id, req.org_id]
    );
    const { rowCount: iExists } = await client.query(
      `SELECT 1 FROM institutions WHERE id = $1 AND org_id = $2`,
      [institution_id, req.org_id]
    );
    if (dExists === 0 || iExists === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Doctor or institution not found in this org' });
    }

    // If marking primary, clear primary on the doctor's other active rows.
    if (is_primary) {
      await client.query(
        `UPDATE hcp_affiliations
         SET is_primary = FALSE
         WHERE org_id = $1 AND doctor_id = $2 AND effective_until IS NULL`,
        [req.org_id, doctor_id]
      );
    }

    const { rows } = await client.query(
      `INSERT INTO hcp_affiliations
        (org_id, doctor_id, institution_id, role, department, is_primary,
         effective_from, effective_until, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, FALSE), $7, $8, $9, $10)
       RETURNING *`,
      [
        req.org_id, doctor_id, institution_id,
        role || null, department || null, is_primary,
        effective_from || null, effective_until || null,
        notes || null, req.user.user_id,
      ]
    );

    await client.query('COMMIT');

    recordAudit({
      req,
      action: 'CREATE',
      tableName: 'hcp_affiliations',
      rowId: rows[0].id,
      after: rows[0],
      reason: `Doctor ${doctor_id} affiliated with institution ${institution_id}`,
    });

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An affiliation with this doctor/institution/role/start-date already exists' });
    }
    console.error('[AFFIL] create error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/affiliations/:id — close (set effective_until) or update fields
// Body: { effective_until?, role?, department?, is_primary?, notes? }
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['role', 'department', 'is_primary', 'effective_until', 'notes'];
    const fields = [];
    const params = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        params.push(req.body[k]);
        fields.push(`${k} = $${params.length}`);
      }
    }
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No updatable fields supplied' });
    }

    const { rows: before } = await db.query(
      `SELECT * FROM hcp_affiliations WHERE id = $1 AND org_id = $2`,
      [id, req.org_id]
    );
    if (before.length === 0) {
      return res.status(404).json({ error: 'Affiliation not found' });
    }

    params.push(id, req.org_id);
    const { rows } = await db.query(
      `UPDATE hcp_affiliations SET ${fields.join(', ')}
       WHERE id = $${params.length - 1} AND org_id = $${params.length}
       RETURNING *`,
      params
    );

    recordAudit({
      req,
      action: 'UPDATE',
      tableName: 'hcp_affiliations',
      rowId: id,
      before: before[0],
      after: rows[0],
    });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[AFFIL] update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/affiliations/:id — hard delete (use sparingly; prefer
// PATCH with effective_until for history preservation).
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: before } = await db.query(
      `SELECT * FROM hcp_affiliations WHERE id = $1 AND org_id = $2`,
      [id, req.org_id]
    );
    if (before.length === 0) {
      return res.status(404).json({ error: 'Affiliation not found' });
    }
    await db.query(
      `DELETE FROM hcp_affiliations WHERE id = $1 AND org_id = $2`,
      [id, req.org_id]
    );
    recordAudit({
      req,
      action: 'DELETE',
      tableName: 'hcp_affiliations',
      rowId: id,
      before: before[0],
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[AFFIL] delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
