/**
 * HCP Enrichment Prompt Builder — Phase C.3
 *
 * Given a sparse doctor profile (name + maybe city + maybe hospital), asks
 * the LLM to suggest: specialty (from our taxonomy), credentials, likely
 * hospital affiliation, common specialty-specific notes.
 *
 * The output is treated as a *suggestion* — a manager confirms before
 * writing back to doctor_profiles. We do NOT call any external APIs (no NPI,
 * no MCI scrape) in this phase; the LLM uses general knowledge. Future
 * extension can add real-source lookups behind the same interface.
 */

function buildHcpEnrichmentMessages(doctor, taxonomyCodes) {
  const known = [
    `Name: ${doctor.name}`,
    doctor.specialty && `Existing specialty (free-text): ${doctor.specialty}`,
    doctor.hospital && `Hospital (free-text): ${doctor.hospital}`,
    doctor.territory && `Territory: ${doctor.territory}`,
    doctor.tier && `Tier (A/B/C): ${doctor.tier}`,
    doctor.phone && `Phone: ${doctor.phone}`,
  ].filter(Boolean).join('\n');

  return [
    {
      role: 'system',
      content: `You enrich pharmaceutical Healthcare Practitioner (HCP) profiles using publicly-available general knowledge.

You are given a sparse doctor profile. Suggest:

1. specialty_code — must be exactly one value from this controlled list:
${taxonomyCodes.map(c => `   - ${c.code} : ${c.display}`).join('\n')}

   If the existing free-text specialty matches one of these, normalise to the matching code. If no clear match, return 'other'.

2. confidence — 'high' / 'medium' / 'low' for the specialty mapping.

3. likely_credentials — common credentials a doctor of this specialty in India would hold (e.g. "MBBS, MD General Medicine, DM Cardiology"). Return as an array of strings.

4. likely_hospital_type — one of: hospital_public, hospital_private, clinic, nursing_home, medical_center, diagnostic_center, other. Use the free-text hospital name if any to inform this.

5. enrichment_notes — short paragraph (1-3 sentences) summarising what you confidently infer about this HCP. Do NOT hallucinate specific phone numbers, addresses, or registration numbers. If you don't know something, say so.

6. data_quality_flags — array of strings flagging likely issues, e.g. ["specialty_string_ambiguous", "no_territory", "single_word_name"].

Return strict JSON only:
{
  "specialty_code": "string",
  "confidence": "high"|"medium"|"low",
  "likely_credentials": ["..."],
  "likely_hospital_type": "string",
  "enrichment_notes": "...",
  "data_quality_flags": ["..."]
}

Be honest about uncertainty. A "low" confidence answer with caveats is better than an over-confident wrong one — a manager reviews every output before it's persisted.`
    },
    {
      role: 'user',
      content: `Sparse doctor profile to enrich:\n${known || '(no fields supplied)'}`
    }
  ];
}

module.exports = { buildHcpEnrichmentMessages };
