/**
 * routes/hcp.js — Phase C.3
 *
 * HCP master-data utility endpoints:
 *   - POST   /api/hcp/enrich/:id    — get LLM enrichment suggestion (synchronous)
 *   - PATCH  /api/hcp/enrich/:id    — confirm & persist suggestion (optionally apply specialty)
 *   - GET    /api/hcp/data-quality  — dashboard: duplicates, missing affiliations, stale profiles
 *
 * RBAC: manager + admin only (this is a curation tool).
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/auditLog');
const { suggestEnrichment, writeEnrichment } = require('../services/hcpEnrichment');

const requireCurator = requireRole('admin', 'manager');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/hcp/enrich/:id — get a suggestion (does NOT persist)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/enrich/:id', requireCurator, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT * FROM doctor_profiles WHERE id = $1 AND org_id = $2`,
      [id, req.org_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const suggestion = await suggestEnrichment(rows[0]);
    res.json({ success: true, data: { suggestion } });
  } catch (err) {
    console.error('[HCP] enrich error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/hcp/enrich/:id — persist the confirmed suggestion
// Body: { suggestion, apply_specialty? }
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/enrich/:id', requireCurator, async (req, res) => {
  try {
    const { id } = req.params;
    const { suggestion, apply_specialty } = req.body;
    if (!suggestion || typeof suggestion !== 'object') {
      return res.status(400).json({ error: 'suggestion (object) is required' });
    }

    const { rows: before } = await db.query(
      `SELECT * FROM doctor_profiles WHERE id = $1 AND org_id = $2`,
      [id, req.org_id]
    );
    if (before.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const updated = await writeEnrichment(req.org_id, id, suggestion, { applySpecialty: !!apply_specialty });

    recordAudit({
      req,
      action: 'UPDATE',
      tableName: 'doctor_profiles',
      rowId: id,
      before: { specialty_code: before[0].specialty_code, last_enriched_at: before[0].last_enriched_at },
      after: { specialty_code: updated?.specialty_code, last_enriched_at: updated?.last_enriched_at, enrichment_applied: !!apply_specialty },
      reason: 'AI enrichment confirmed and persisted',
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[HCP] enrich persist error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hcp/data-quality — dashboard counters + samples
// Returns:
//   - missing_affiliation : doctors with no row in hcp_affiliations
//   - missing_specialty   : doctors with no specialty AND no specialty_code
//   - duplicate_candidates : groups of 2+ doctors sharing (lower(name), territory)
//   - stale_profiles      : enriched > 180 days ago OR never enriched
//   - free_text_specialty : doctors whose `specialty` string doesn't map to taxonomy
// ─────────────────────────────────────────────────────────────────────────────
router.get('/data-quality', requireCurator, async (req, res) => {
  try {
    // Missing affiliation
    const { rows: missingAffil } = await db.query(
      `SELECT d.id, d.name, d.specialty, d.territory
       FROM doctor_profiles d
       WHERE d.org_id = $1
         AND NOT EXISTS (
           SELECT 1 FROM hcp_affiliations a
           WHERE a.doctor_id = d.id AND a.org_id = d.org_id
         )
       ORDER BY d.name
       LIMIT 50`,
      [req.org_id]
    );

    // Missing specialty (both fields null/empty)
    const { rows: missingSpecialty } = await db.query(
      `SELECT id, name, territory
       FROM doctor_profiles
       WHERE org_id = $1
         AND specialty_code IS NULL
         AND (specialty IS NULL OR TRIM(specialty) = '')
       ORDER BY name
       LIMIT 50`,
      [req.org_id]
    );

    // Free-text specialty that doesn't map to a taxonomy display label or code.
    // Heuristic: lower(specialty) doesn't match any lower(display) or code.
    const { rows: freeTextSpecialty } = await db.query(
      `SELECT d.id, d.name, d.specialty, d.territory
       FROM doctor_profiles d
       WHERE d.org_id = $1
         AND d.specialty IS NOT NULL
         AND TRIM(d.specialty) <> ''
         AND d.specialty_code IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM hcp_specialties_taxonomy t
           WHERE LOWER(t.display) = LOWER(d.specialty) OR t.code = LOWER(d.specialty)
         )
       ORDER BY d.name
       LIMIT 50`,
      [req.org_id]
    );

    // Duplicate candidates: 2+ rows sharing lower(name) within the same territory
    const { rows: dupes } = await db.query(
      `SELECT LOWER(name) AS name_key, territory, COUNT(*)::int AS occurrences,
              ARRAY_AGG(id ORDER BY id) AS doctor_ids
       FROM doctor_profiles
       WHERE org_id = $1
       GROUP BY LOWER(name), territory
       HAVING COUNT(*) > 1
       ORDER BY COUNT(*) DESC, name_key
       LIMIT 50`,
      [req.org_id]
    );

    // Stale: never enriched OR last_enriched_at < now()-180d
    const { rows: stale } = await db.query(
      `SELECT id, name, specialty, territory, last_enriched_at
       FROM doctor_profiles
       WHERE org_id = $1
         AND (last_enriched_at IS NULL OR last_enriched_at < NOW() - INTERVAL '180 days')
       ORDER BY last_enriched_at NULLS FIRST
       LIMIT 50`,
      [req.org_id]
    );

    // Top-line counters
    const { rows: counters } = await db.query(
      `SELECT
         (SELECT COUNT(*)::int FROM doctor_profiles WHERE org_id = $1) AS total_doctors,
         (SELECT COUNT(*)::int FROM doctor_profiles d WHERE d.org_id = $1
            AND NOT EXISTS (SELECT 1 FROM hcp_affiliations a WHERE a.doctor_id = d.id AND a.org_id = d.org_id)) AS doctors_without_affiliation,
         (SELECT COUNT(*)::int FROM doctor_profiles WHERE org_id = $1 AND specialty_code IS NULL) AS doctors_without_taxonomy_code,
         (SELECT COUNT(*)::int FROM doctor_profiles WHERE org_id = $1 AND last_enriched_at IS NULL) AS doctors_never_enriched,
         (SELECT COUNT(*)::int FROM institutions WHERE org_id = $1) AS total_institutions`,
      [req.org_id]
    );

    res.json({
      success: true,
      data: {
        counters: counters[0],
        missing_affiliation: missingAffil,
        missing_specialty: missingSpecialty,
        free_text_specialty: freeTextSpecialty,
        duplicate_candidates: dupes,
        stale_profiles: stale,
      }
    });
  } catch (err) {
    console.error('[HCP] data-quality error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
