/**
 * services/kolIdentifier.js — Phase C.2
 *
 * Synchronous LLM call (manager is waiting). Bundles signals from DCR +
 * RCPA + affiliations + existing KOL row and returns a tier suggestion.
 * Persistence is a separate route step after manager confirmation.
 */

const db = require('../config/db');
const { getLLMService } = require('./llm');
const { buildKolIdentifierMessages } = require('../prompts/kolIdentifier');

const VALID_TIERS = new Set(['T1', 'T2', 'T3', 'emerging', 'not_kol']);

async function gatherSignals(orgId, doctorId) {
  // Recent DCR count + last 3 call summaries (90 days)
  const { rows: dcrRows } = await db.query(
    `SELECT call_summary, doctor_feedback, date
     FROM dcr
     WHERE org_id = $1
       AND name = (SELECT name FROM doctor_profiles WHERE id = $2 AND org_id = $1)
       AND (date IS NULL OR date >= NOW() - INTERVAL '90 days')
     ORDER BY date DESC NULLS LAST
     LIMIT 5`,
    [orgId, doctorId]
  );
  const recentDcrCount = dcrRows.length;
  const recentDcrSummary = dcrRows
    .map(r => [r.call_summary, r.doctor_feedback].filter(Boolean).join(' | '))
    .filter(Boolean)
    .slice(0, 3)
    .join('  /  ') || '';

  // RCPA recent volume — sum competitor + own units in the last 90 days for this doctor
  let rcpaVolume = null;
  try {
    const { rows: rcpaRows } = await db.query(
      `SELECT COALESCE(SUM(units_our_brand),0)::int + COALESCE(SUM(units_competitor),0)::int AS total
       FROM rcpa
       WHERE org_id = $1 AND doctor_id = $2
         AND visit_date >= NOW() - INTERVAL '90 days'`,
      [orgId, doctorId]
    );
    rcpaVolume = rcpaRows[0]?.total ?? null;
  } catch (_) {
    // Schema variations: be defensive — if rcpa columns differ in this DB, skip the signal.
    rcpaVolume = null;
  }

  // Affiliations
  const { rows: affilRows } = await db.query(
    `SELECT i.name AS institution_name, i.institution_type, a.role, a.is_primary
     FROM hcp_affiliations a
     JOIN institutions i ON i.id = a.institution_id AND i.org_id = a.org_id
     WHERE a.org_id = $1 AND a.doctor_id = $2 AND a.effective_until IS NULL
     ORDER BY a.is_primary DESC, a.effective_from ASC`,
    [orgId, doctorId]
  );

  // Existing KOL row, if any
  const { rows: kolRows } = await db.query(
    `SELECT * FROM kol_profiles WHERE org_id = $1 AND doctor_id = $2`,
    [orgId, doctorId]
  );

  return {
    recent_dcrs: recentDcrCount,
    recent_dcr_summary: recentDcrSummary,
    rcpa_volume_recent: rcpaVolume,
    affiliations: affilRows,
    existing_kol: kolRows[0] || null,
  };
}

async function suggestKolClassification(orgId, doctorId) {
  const { rows: docRows } = await db.query(
    `SELECT * FROM doctor_profiles WHERE id = $1 AND org_id = $2`,
    [doctorId, orgId]
  );
  if (docRows.length === 0) {
    throw new Error('Doctor not found');
  }
  const doctor = docRows[0];
  const signals = await gatherSignals(orgId, doctorId);

  const messages = buildKolIdentifierMessages(doctor, signals);
  const llm = getLLMService();
  const result = await llm.chat(messages, { requireJson: true });

  if (!result || typeof result !== 'object') {
    throw new Error('LLM returned no usable KOL suggestion');
  }
  if (result.recommended_tier && !VALID_TIERS.has(result.recommended_tier)) {
    result.recommended_tier_invalid = result.recommended_tier;
    result.recommended_tier = 'emerging';
  }

  return { suggestion: result, signals };
}

module.exports = { suggestKolClassification, gatherSignals };
