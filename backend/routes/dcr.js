const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { scanForAdverseEvents } = require('../services/aeDetection');
const { recordDcrSampleDistributions } = require('../services/sampleDistribution');
const { scanDcrForCompliance } = require('../services/complianceWatchdog');
const { recordAudit } = require('../middleware/auditLog');

// Best-effort: resolve a doctor_id by name + org so we can record a
// compliance finding if consent for marketing_visit has been revoked.
// We deliberately do NOT block the DCR — the rep may have valid grounds
// (post-revocation safety follow-up); the finding lets the officer triage.
async function flagUnconsentedVisitIfNeeded(savedDcr) {
  try {
    if (!savedDcr.name) return;
    const { rows: docRows } = await db.query(
      `SELECT id FROM doctor_profiles
       WHERE org_id = $1 AND LOWER(name) = LOWER($2)
       LIMIT 1`,
      [savedDcr.org_id, savedDcr.name]
    );
    if (docRows.length === 0) return;
    const doctorId = docRows[0].id;

    const { rows: cRows } = await db.query(
      `SELECT status FROM consent_records
       WHERE org_id = $1 AND doctor_id = $2 AND channel = 'marketing_visit'
       ORDER BY recorded_at DESC LIMIT 1`,
      [savedDcr.org_id, doctorId]
    );
    if (cRows.length === 0) return;             // never recorded — implicit allowed
    if (cRows[0].status === 'granted') return;  // active consent — fine

    // Latest is revoked / withdrawn → log a finding for the officer
    await db.query(
      `INSERT INTO compliance_findings
        (org_id, finding_type, severity, source_table, source_row_id,
         user_id, description, recommendation, detected_by)
       VALUES ($1, 'unconsented_contact', 'high', 'dcr', $2, $3, $4, $5, 'rule')`,
      [
        savedDcr.org_id,
        String(savedDcr.id),
        savedDcr.user_id || null,
        `Marketing visit recorded for doctor "${savedDcr.name}" (id=${doctorId}) whose consent for marketing_visit is currently '${cRows[0].status}'.`,
        'Confirm whether the visit was for a permitted purpose (e.g., safety follow-up) and re-record consent if it has changed.',
      ]
    );
    console.log(`[WATCHDOG] Logged unconsented_contact finding for DCR ${savedDcr.id}`);
  } catch (err) {
    console.error('[WATCHDOG] Consent check error:', err.message);
  }
}

// POST /api/dcr — MR submits a new Daily Call Report
router.post('/', async (req, res) => {
  try {
    const { name, date, visit_time, product, samples, callSummary, user_id, doctor_feedback, edetailing } = req.body;

    const { rows } = await db.query(
      `INSERT INTO dcr (org_id, user_id, name, date, visit_time, product, samples, call_summary, doctor_feedback, edetailing)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.org_id,
        user_id,
        name,
        date || null,
        visit_time || new Date().toISOString(),
        product,
        samples ? JSON.stringify(samples) : null,
        callSummary || null,
        doctor_feedback || null,
        edetailing ? JSON.stringify(edetailing) : null
      ]
    );

    const savedDcr = rows[0];

    // Audit trail (regulated entity)
    recordAudit({
      req,
      action: 'CREATE',
      tableName: 'dcr',
      rowId: savedDcr.id,
      after: savedDcr,
    });

    // Async AE detection — fire and forget, never blocks DCR response
    scanForAdverseEvents(savedDcr).catch(err =>
      console.error('[AE] Background scan error:', err.message)
    );

    // Async Compliance Watchdog (off-label / fair-balance / gifts / claims)
    scanDcrForCompliance(savedDcr).catch(err =>
      console.error('[WATCHDOG] Background scan error:', err.message)
    );

    // Async consent rule-check — flags marketing-visit-after-revocation
    flagUnconsentedVisitIfNeeded(savedDcr).catch(err =>
      console.error('[WATCHDOG] Consent rule check error:', err.message)
    );

    // Async sample-distribution ledger — debits MR's stock for each sample
    // listed in the DCR. Same fire-and-forget contract as AE detection: this
    // never blocks the DCR response and never throws to the caller.
    recordDcrSampleDistributions(savedDcr).catch(err =>
      console.error('[Samples] DCR hook error:', err.message)
    );

    res.status(201).json({ success: true, data: savedDcr });
  } catch (err) {
    console.error('[DCR] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dcr — Fetch all DCRs (most recent first) or filter by user_id
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;

    let query = 'SELECT * FROM dcr WHERE org_id = $1';
    const params = [req.org_id];

    if (user_id) {
      params.push(user_id);
      query += ` AND user_id = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await db.query(query, params);

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('[DCR] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
