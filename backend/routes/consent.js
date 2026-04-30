/**
 * routes/consent.js — Phase C.1
 *
 * Per-doctor consent management. Append-only — every grant / revoke /
 * withdraw is a new row in `consent_records`. The current state per
 * (doctor_id, channel) is the latest row by `recorded_at`.
 *
 * The /check helper is what other routes call before sending marketing
 * emails / scheduling marketing visits / distributing samples — see the
 * consent-enforcement wiring done as part of Phase C.1.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { recordAudit } = require('../middleware/auditLog');

const VALID_CHANNELS = ['marketing_email', 'marketing_visit', 'sample_distribution', 'data_processing'];
const VALID_STATUSES = ['granted', 'revoked', 'withdrawn'];
const VALID_SOURCES  = ['verbal', 'written', 'digital_signature', 'imported'];

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/consent/doctor/:doctorId — current consent state per channel
// Returns ONE row per channel: the latest recorded for that (doctor, channel).
// Channels with no record at all return implicit "no_consent".
// ─────────────────────────────────────────────────────────────────────────────
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Latest-per-channel via DISTINCT ON. Postgres-specific but very fast
    // when the (org_id, doctor_id, channel, recorded_at DESC) index is used.
    const { rows: latest } = await db.query(
      `SELECT DISTINCT ON (channel)
              id, channel, status, recorded_by, source, notes,
              effective_from, effective_until, recorded_at
       FROM consent_records
       WHERE org_id = $1 AND doctor_id = $2
       ORDER BY channel, recorded_at DESC`,
      [req.org_id, doctorId]
    );

    // Build a stable shape: every valid channel present, with implicit no_consent.
    const byChannel = Object.fromEntries(
      VALID_CHANNELS.map(ch => [ch, { channel: ch, status: 'no_consent' }])
    );
    for (const row of latest) {
      byChannel[row.channel] = row;
    }

    res.json({ success: true, data: { doctor_id: Number(doctorId), channels: byChannel } });
  } catch (err) {
    console.error('[CONSENT] state error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/consent/doctor/:doctorId/history — full append-only history
// ─────────────────────────────────────────────────────────────────────────────
router.get('/doctor/:doctorId/history', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { channel } = req.query;

    const params = [req.org_id, doctorId];
    let chanFilter = '';
    if (channel) {
      params.push(channel);
      chanFilter = `AND channel = $${params.length}`;
    }

    const { rows } = await db.query(
      `SELECT id, channel, status, recorded_by, source, notes,
              effective_from, effective_until, recorded_at
       FROM consent_records
       WHERE org_id = $1 AND doctor_id = $2 ${chanFilter}
       ORDER BY recorded_at DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[CONSENT] history error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/consent — record a new consent event (grant / revoke / withdraw)
// Body: { doctor_id, channel, status, source?, notes?, effective_from?, effective_until? }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { doctor_id, channel, status, source, notes, effective_from, effective_until } = req.body;

    if (!doctor_id || !channel || !status) {
      return res.status(400).json({ error: 'doctor_id, channel and status are required' });
    }
    if (!VALID_CHANNELS.includes(channel)) {
      return res.status(400).json({ error: `channel must be one of: ${VALID_CHANNELS.join(', ')}` });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    if (source && !VALID_SOURCES.includes(source)) {
      return res.status(400).json({ error: `source must be one of: ${VALID_SOURCES.join(', ')}` });
    }

    // Confirm doctor exists in this org
    const { rowCount: docExists } = await db.query(
      `SELECT 1 FROM doctor_profiles WHERE id = $1 AND org_id = $2`,
      [doctor_id, req.org_id]
    );
    if (docExists === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const { rows } = await db.query(
      `INSERT INTO consent_records
        (org_id, doctor_id, channel, status, recorded_by, source, notes, effective_from, effective_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.org_id,
        doctor_id,
        channel,
        status,
        req.user.user_id,
        source || null,
        notes || null,
        effective_from || null,
        effective_until || null,
      ]
    );

    recordAudit({
      req,
      action: 'CREATE',
      tableName: 'consent_records',
      rowId: rows[0].id,
      after: rows[0],
      reason: `Consent ${status} on channel '${channel}' for doctor ${doctor_id}`,
    });

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[CONSENT] create error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/consent/check — does this doctor have ACTIVE consent on this channel?
// Query: ?doctor_id=X&channel=Y
// Used by other routes (DCR creation, marketing email sender, sample handout).
// Returns { allowed, status, recorded_at }.
// "allowed" is true only when latest row for this (doctor, channel) is
// status='granted' AND effective_until is NULL or in the future.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/check', async (req, res) => {
  try {
    const { doctor_id, channel } = req.query;

    if (!doctor_id || !channel) {
      return res.status(400).json({ error: 'doctor_id and channel are required' });
    }
    if (!VALID_CHANNELS.includes(channel)) {
      return res.status(400).json({ error: `channel must be one of: ${VALID_CHANNELS.join(', ')}` });
    }

    const { rows } = await db.query(
      `SELECT id, status, effective_from, effective_until, recorded_at
       FROM consent_records
       WHERE org_id = $1 AND doctor_id = $2 AND channel = $3
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [req.org_id, doctor_id, channel]
    );

    if (rows.length === 0) {
      return res.json({
        success: true,
        data: { allowed: false, status: 'no_consent', recorded_at: null }
      });
    }

    const latest = rows[0];
    const now = new Date();
    const expired = latest.effective_until && new Date(latest.effective_until) < now;
    const allowed = latest.status === 'granted' && !expired;

    res.json({
      success: true,
      data: {
        allowed,
        status: latest.status,
        recorded_at: latest.recorded_at,
        effective_until: latest.effective_until,
      }
    });
  } catch (err) {
    console.error('[CONSENT] check error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
