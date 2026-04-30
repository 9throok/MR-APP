/**
 * routes/kols.js — Phase C.2
 *
 * KOL profile CRUD + AI KOL Identifier flow.
 *
 * Routes:
 *   GET   /api/kols                         — list with filters
 *   GET   /api/kols/:doctor_id              — KOL row for a doctor (or 404)
 *   POST  /api/kols                         — create / upsert KOL row
 *   PATCH /api/kols/:doctor_id              — update KOL fields
 *   POST  /api/kols/identify/:doctor_id     — get AI suggestion (no persist)
 *   PATCH /api/kols/identify/:doctor_id     — confirm AI suggestion + persist
 *
 * RBAC: medical_reviewer / manager / admin.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/auditLog');
const { suggestKolClassification } = require('../services/kolIdentifier');

const VALID_TIERS = ['T1', 'T2', 'T3', 'emerging'];
const requireMedAffairs = requireRole('admin', 'manager', 'medical_reviewer');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/kols — list with filters
// Query: ?tier=&territory=&specialty_code=
// Joins doctor_profiles for display fields.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', requireMedAffairs, async (req, res) => {
  try {
    const { tier, territory, specialty_code } = req.query;
    const params = [req.org_id];
    const where = ['k.org_id = $1'];

    if (tier)           { params.push(tier);           where.push(`k.kol_tier = $${params.length}`); }
    if (territory)      { params.push(territory);      where.push(`d.territory = $${params.length}`); }
    if (specialty_code) { params.push(specialty_code); where.push(`d.specialty_code = $${params.length}`); }

    const { rows } = await db.query(
      `SELECT k.*,
              d.name AS doctor_name, d.specialty, d.specialty_code,
              d.territory, d.tier AS commercial_tier
       FROM kol_profiles k
       JOIN doctor_profiles d ON d.id = k.doctor_id AND d.org_id = k.org_id
       WHERE ${where.join(' AND ')}
       ORDER BY k.influence_score DESC NULLS LAST, d.name
       LIMIT 200`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[KOL] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/kols/stats — top-line counters for the dashboard
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', requireMedAffairs, async (req, res) => {
  try {
    const { rows: byTier } = await db.query(
      `SELECT kol_tier, COUNT(*)::int AS total
       FROM kol_profiles WHERE org_id = $1 GROUP BY kol_tier`,
      [req.org_id]
    );
    const { rows: counters } = await db.query(
      `SELECT
         (SELECT COUNT(*)::int FROM kol_profiles WHERE org_id = $1) AS total_kols,
         (SELECT COUNT(*)::int FROM kol_profiles WHERE org_id = $1 AND advisory_board_member = TRUE) AS advisory_board_members,
         (SELECT COUNT(*)::int FROM kol_profiles WHERE org_id = $1 AND speaker_bureau = TRUE) AS speaker_bureau_members,
         (SELECT COUNT(*)::int FROM kol_profiles WHERE org_id = $1 AND identified_by = 'ai') AS ai_suggested`,
      [req.org_id]
    );
    res.json({ success: true, data: { byTier, counters: counters[0] } });
  } catch (err) {
    console.error('[KOL] stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/kols/identify/:doctor_id — get AI suggestion (no persist)
// MUST be defined before the /:doctor_id route to avoid param capture.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/identify/:doctor_id', requireMedAffairs, async (req, res) => {
  try {
    const { doctor_id } = req.params;
    const result = await suggestKolClassification(req.org_id, doctor_id);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[KOL] identify error:', err.message);
    res.status(err.message === 'Doctor not found' ? 404 : 500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/kols/identify/:doctor_id — confirm + persist AI suggestion
// Body: { suggestion: { recommended_tier, influence_score, rationale, ... } }
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/identify/:doctor_id', requireMedAffairs, async (req, res) => {
  try {
    const { doctor_id } = req.params;
    const { suggestion } = req.body;
    if (!suggestion || typeof suggestion !== 'object') {
      return res.status(400).json({ error: 'suggestion (object) is required' });
    }

    const tier = suggestion.recommended_tier && VALID_TIERS.includes(suggestion.recommended_tier)
      ? suggestion.recommended_tier
      : null;

    const score = typeof suggestion.influence_score === 'number'
      ? Math.max(0, Math.min(100, suggestion.influence_score))
      : null;

    // Upsert: one row per (org, doctor)
    const { rows: before } = await db.query(
      `SELECT * FROM kol_profiles WHERE org_id = $1 AND doctor_id = $2`,
      [req.org_id, doctor_id]
    );

    let result;
    if (before.length === 0) {
      const { rows } = await db.query(
        `INSERT INTO kol_profiles
          (org_id, doctor_id, kol_tier, influence_score,
           identified_by, identified_at, notes, created_by)
         VALUES ($1, $2, $3, $4, 'ai', NOW(), $5, $6)
         RETURNING *`,
        [
          req.org_id, doctor_id, tier, score,
          suggestion.rationale || null, req.user.user_id,
        ]
      );
      result = rows[0];
    } else {
      const { rows } = await db.query(
        `UPDATE kol_profiles
         SET kol_tier = COALESCE($1, kol_tier),
             influence_score = COALESCE($2, influence_score),
             identified_by = 'ai',
             identified_at = NOW(),
             notes = $3
         WHERE org_id = $4 AND doctor_id = $5
         RETURNING *`,
        [tier, score, suggestion.rationale || null, req.org_id, doctor_id]
      );
      result = rows[0];
    }

    recordAudit({
      req,
      action: before.length === 0 ? 'CREATE' : 'UPDATE',
      tableName: 'kol_profiles',
      rowId: result.id,
      before: before[0] || null,
      after: result,
      reason: 'AI KOL suggestion confirmed',
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[KOL] identify persist error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/kols/:doctor_id — single KOL profile (or 404)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:doctor_id', requireMedAffairs, async (req, res) => {
  try {
    const { doctor_id } = req.params;
    const { rows } = await db.query(
      `SELECT k.*, d.name AS doctor_name, d.specialty, d.specialty_code, d.territory, d.tier AS commercial_tier
       FROM kol_profiles k
       JOIN doctor_profiles d ON d.id = k.doctor_id AND d.org_id = k.org_id
       WHERE k.org_id = $1 AND k.doctor_id = $2`,
      [req.org_id, doctor_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No KOL profile for this doctor' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[KOL] detail error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/kols — create / upsert (manual classification by manager)
// Body: { doctor_id, kol_tier, influence_score?, advisory_board_member?,
//         speaker_bureau?, publication_count?, sentiment_score?, notes? }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', requireMedAffairs, async (req, res) => {
  try {
    const {
      doctor_id, kol_tier, influence_score,
      advisory_board_member, speaker_bureau, publication_count,
      sentiment_score, sentiment_evidence, notes,
    } = req.body;

    if (!doctor_id) {
      return res.status(400).json({ error: 'doctor_id is required' });
    }
    if (kol_tier && !VALID_TIERS.includes(kol_tier)) {
      return res.status(400).json({ error: `kol_tier must be one of: ${VALID_TIERS.join(', ')}` });
    }

    const { rowCount: dExists } = await db.query(
      `SELECT 1 FROM doctor_profiles WHERE id = $1 AND org_id = $2`,
      [doctor_id, req.org_id]
    );
    if (dExists === 0) {
      return res.status(404).json({ error: 'Doctor not found in this org' });
    }

    const { rows: before } = await db.query(
      `SELECT * FROM kol_profiles WHERE org_id = $1 AND doctor_id = $2`,
      [req.org_id, doctor_id]
    );

    let result;
    if (before.length === 0) {
      const { rows } = await db.query(
        `INSERT INTO kol_profiles
          (org_id, doctor_id, kol_tier, influence_score,
           advisory_board_member, speaker_bureau, publication_count,
           sentiment_score, sentiment_evidence, notes,
           identified_by, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'human',$11)
         RETURNING *`,
        [
          req.org_id, doctor_id,
          kol_tier || null, influence_score ?? null,
          advisory_board_member ?? false, speaker_bureau ?? false, publication_count ?? 0,
          sentiment_score ?? null, sentiment_evidence || null, notes || null,
          req.user.user_id,
        ]
      );
      result = rows[0];
    } else {
      // Upsert: update existing row
      const { rows } = await db.query(
        `UPDATE kol_profiles SET
          kol_tier = COALESCE($1, kol_tier),
          influence_score = COALESCE($2, influence_score),
          advisory_board_member = COALESCE($3, advisory_board_member),
          speaker_bureau = COALESCE($4, speaker_bureau),
          publication_count = COALESCE($5, publication_count),
          sentiment_score = COALESCE($6, sentiment_score),
          sentiment_evidence = COALESCE($7, sentiment_evidence),
          notes = COALESCE($8, notes),
          identified_by = 'human'
         WHERE org_id = $9 AND doctor_id = $10
         RETURNING *`,
        [
          kol_tier ?? null, influence_score ?? null,
          advisory_board_member ?? null, speaker_bureau ?? null, publication_count ?? null,
          sentiment_score ?? null, sentiment_evidence ?? null, notes ?? null,
          req.org_id, doctor_id,
        ]
      );
      result = rows[0];
    }

    recordAudit({
      req,
      action: before.length === 0 ? 'CREATE' : 'UPDATE',
      tableName: 'kol_profiles',
      rowId: result.id,
      before: before[0] || null,
      after: result,
      reason: before.length === 0 ? 'KOL profile created' : 'KOL profile updated',
    });

    res.status(before.length === 0 ? 201 : 200).json({ success: true, data: result });
  } catch (err) {
    console.error('[KOL] upsert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/kols/:doctor_id — update specific fields
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:doctor_id', requireMedAffairs, async (req, res) => {
  try {
    const { doctor_id } = req.params;
    const allowed = [
      'kol_tier', 'influence_score',
      'advisory_board_member', 'speaker_bureau', 'publication_count',
      'sentiment_score', 'sentiment_evidence', 'notes',
      'last_engagement_at', 'last_engagement_type',
    ];
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
    if (req.body.kol_tier && !VALID_TIERS.includes(req.body.kol_tier)) {
      return res.status(400).json({ error: `kol_tier must be one of: ${VALID_TIERS.join(', ')}` });
    }

    const { rows: before } = await db.query(
      `SELECT * FROM kol_profiles WHERE org_id = $1 AND doctor_id = $2`,
      [req.org_id, doctor_id]
    );
    if (before.length === 0) {
      return res.status(404).json({ error: 'KOL profile not found' });
    }

    params.push(req.org_id, doctor_id);
    const { rows } = await db.query(
      `UPDATE kol_profiles SET ${fields.join(', ')}
       WHERE org_id = $${params.length - 1} AND doctor_id = $${params.length}
       RETURNING *`,
      params
    );

    recordAudit({
      req,
      action: 'UPDATE',
      tableName: 'kol_profiles',
      rowId: rows[0].id,
      before: before[0],
      after: rows[0],
    });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[KOL] patch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
