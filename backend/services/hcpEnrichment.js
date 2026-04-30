/**
 * services/hcpEnrichment.js — Phase C.3
 *
 * Synchronous LLM call (unlike aeDetection/contentScanner which are
 * fire-and-forget) because the manager is sitting in front of the screen
 * waiting for the suggestion. Returns the suggestion object; the route
 * decides whether to persist it.
 *
 * Persistence path: route handler optionally calls writeEnrichment() after
 * the user confirms — this stamps last_enriched_at and stashes the raw
 * payload in enrichment_metadata.
 */

const db = require('../config/db');
const { getLLMService } = require('./llm');
const { buildHcpEnrichmentMessages } = require('../prompts/hcpEnrichment');

async function suggestEnrichment(doctorRow) {
  const { rows: codes } = await db.query(
    `SELECT code, display FROM hcp_specialties_taxonomy WHERE active = TRUE ORDER BY display`
  );

  const messages = buildHcpEnrichmentMessages(doctorRow, codes);
  const llm = getLLMService();
  const result = await llm.chat(messages, { requireJson: true });

  if (!result || typeof result !== 'object') {
    throw new Error('LLM returned no usable enrichment payload');
  }

  // Validate the specialty_code if present, otherwise coerce to 'other'.
  if (result.specialty_code) {
    const valid = codes.some(c => c.code === result.specialty_code);
    if (!valid) {
      result.specialty_code_invalid = result.specialty_code;
      result.specialty_code = 'other';
    }
  }

  return result;
}

async function writeEnrichment(orgId, doctorId, payload, opts = {}) {
  const { applySpecialty = false } = opts;
  const fields = ['last_enriched_at = NOW()', 'enrichment_metadata = $1'];
  const params = [JSON.stringify(payload)];

  if (applySpecialty && payload && payload.specialty_code) {
    params.push(payload.specialty_code);
    fields.push(`specialty_code = $${params.length}`);
  }

  params.push(doctorId);
  params.push(orgId);
  const { rows } = await db.query(
    `UPDATE doctor_profiles SET ${fields.join(', ')}
     WHERE id = $${params.length - 1} AND org_id = $${params.length}
     RETURNING *`,
    params
  );
  return rows[0] || null;
}

module.exports = { suggestEnrichment, writeEnrichment };
