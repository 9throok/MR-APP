/**
 * KOL Identifier Prompt Builder — Phase C.2
 *
 * Given a doctor's signal bundle (visit history, RCPA, affiliations, current
 * KOL flag if any), asks the LLM to score them as a Key Opinion Leader and
 * suggest the right tier + rationale + activation actions.
 *
 * Decisions are saved to kol_profiles only after a manager confirms — same
 * pattern as the HCP Enrichment flow in C.3.
 */

function buildKolIdentifierMessages(doctor, signals) {
  // signals shape: {
  //   recent_dcrs: number,
  //   recent_dcr_summary: string,
  //   rcpa_volume_recent: number,
  //   affiliations: [{institution_name, institution_type, role, is_primary}],
  //   existing_kol: { kol_tier, influence_score, advisory_board_member, speaker_bureau, publication_count, sentiment_score } | null
  // }

  const affilLine = (signals.affiliations || []).map(a =>
    `- ${a.institution_name} (${a.institution_type}) — ${a.role || 'role n/a'}${a.is_primary ? ' [PRIMARY]' : ''}`
  ).join('\n') || '(none on record)';

  const existing = signals.existing_kol
    ? `Already classified: tier=${signals.existing_kol.kol_tier || 'n/a'}, influence_score=${signals.existing_kol.influence_score ?? 'n/a'}, advisory_board=${signals.existing_kol.advisory_board_member}, speaker=${signals.existing_kol.speaker_bureau}, publications=${signals.existing_kol.publication_count}, sentiment=${signals.existing_kol.sentiment_score ?? 'n/a'}`
    : 'Not currently classified as a KOL.';

  return [
    {
      role: 'system',
      content: `You are a medical affairs analyst identifying Key Opinion Leaders (KOLs) for a pharma company in India. KOLs influence prescribing through advisory boards, speaker programs, publications, and peer authority. They differ from high-prescribers — a doctor can be a high prescriber without being a KOL, and vice versa.

A manager will review and confirm your output before it's persisted. Be honest about uncertainty. The signals you have are field-rep observations; you do not have publication databases or society membership lookups.

Score the doctor and recommend a tier:
- T1 = national / cross-specialty influence (rare; usually requires confirmed publications + advisory board roles)
- T2 = regional / specialty-level influence (advisory member, speaker, well-affiliated)
- T3 = local influence (high-volume + peer-respected within a single hospital or city)
- emerging = signals trending up but not yet confirmed

Return strict JSON:
{
  "recommended_tier": "T1" | "T2" | "T3" | "emerging" | "not_kol",
  "influence_score": <number 0-100>,
  "rationale": "1-3 sentence explanation citing specific signals.",
  "key_signals": ["..."],
  "suggested_actions": ["e.g. 'Invite to upcoming Mumbai cardiology advisory board'", "e.g. 'Initiate medical query Q&A loop'"],
  "data_gaps": ["e.g. 'Publication count unknown'", "e.g. 'No advisory board history captured'"]
}`
    },
    {
      role: 'user',
      content: `Doctor: ${doctor.name}
Specialty: ${doctor.specialty || 'unknown'} (code: ${doctor.specialty_code || 'unmapped'})
Tier (commercial): ${doctor.tier || 'unknown'}
Territory: ${doctor.territory || 'unknown'}

Recent visit activity (90 days): ${signals.recent_dcrs || 0} DCRs.
Recent visit summary: ${signals.recent_dcr_summary || '(none)'}

Recent RCPA prescription volume signal: ${signals.rcpa_volume_recent || '(no data)'}

Affiliations:
${affilLine}

KOL state: ${existing}`
    }
  ];
}

module.exports = { buildKolIdentifierMessages };
