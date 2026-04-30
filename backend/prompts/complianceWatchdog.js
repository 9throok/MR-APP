/**
 * Compliance Watchdog Prompt Builder — Phase C.1
 *
 * Scans DCR call notes (and optionally expense receipts / content snippets)
 * for compliance violations distinct from adverse events:
 *   - off_label_promotion: claims about uses not in the drug's approved label
 *   - missing_fair_balance: efficacy claims without paired safety information
 *   - gift_value_threshold: gifts/meals/honoraria over the country threshold
 *   - unsubstantiated_claim: medical claim with no cited evidence
 *
 * Companion to aeDetection.js — that one finds patient-safety signals; this
 * one finds promotional / financial / regulatory signals.
 */

function buildComplianceWatchdogMessages(dcrRow, productLabel) {
  const callText = [
    dcrRow.call_summary && `Call Summary: ${dcrRow.call_summary}`,
    dcrRow.doctor_feedback && `Doctor Feedback: ${dcrRow.doctor_feedback}`,
    dcrRow.gifts_or_samples && `Gifts/Samples Given: ${dcrRow.gifts_or_samples}`,
  ].filter(Boolean).join('\n');

  const labelHint = productLabel
    ? `\n\nApproved label / on-label uses for ${dcrRow.product}:\n${productLabel}`
    : '';

  return [
    {
      role: 'system',
      content: `You are a pharma compliance screening assistant. Analyze field call notes for promotional and financial compliance issues. You are NOT looking for adverse events (a separate system handles those) — you are looking for:

1. OFF-LABEL PROMOTION — the rep promoted the drug for a use that is NOT on its approved label. Indicators: discussion of indications, patient populations, or doses outside the label.

2. MISSING FAIR BALANCE — the rep made an efficacy claim without paired safety information. Pharma promotional rules require efficacy claims be balanced with relevant risks. Indicators: "X% reduction" or "best in class" without any mention of side effects, contraindications, or precautions.

3. GIFT VALUE THRESHOLD — gifts, meals, honoraria, or sponsorships of a value likely above the local threshold. Indicators in the notes: brand-name lunches at high-end venues, expensive items, large cash equivalents. Default threshold for India: ~INR 1,000/visit. Use judgment — flag if uncertain so a human can confirm.

4. UNSUBSTANTIATED CLAIM — a specific medical claim ("38% reduction", "twice as effective") with no cited evidence in the call. The rep should reference the source.

IMPORTANT: Err on the side of flagging — false positives are reviewed by a compliance officer, false negatives are regulatory exposure. If unclear, set severity 'low' and let the officer decide.

Return strict JSON:
{
  "compliance_issues_detected": true/false,
  "findings": [
    {
      "finding_type": "off_label_promotion" | "missing_fair_balance" | "gift_value_threshold" | "unsubstantiated_claim",
      "severity": "low" | "medium" | "high" | "critical",
      "description": "One-sentence explanation in plain English",
      "evidence_quote": "The verbatim phrase from the notes that triggered this",
      "recommendation": "What the rep / officer should do"
    }
  ],
  "reasoning": "Why these findings (or none) were chosen"
}

If no issues, return: {"compliance_issues_detected": false, "findings": [], "reasoning": "..."}.
Use simple, everyday English. The compliance officer is a pharmacist or lawyer, not a regulatory specialist.${labelHint}`
    },
    {
      role: 'user',
      content: `Product discussed: ${dcrRow.product}\nDoctor: ${dcrRow.name}\nDate: ${dcrRow.date}\n\n${callText || '(no call notes)'}`
    }
  ];
}

module.exports = { buildComplianceWatchdogMessages };
