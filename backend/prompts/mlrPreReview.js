/**
 * MLR Pre-Review Prompt
 *
 * Phase B feature: an AI pass that runs when a content version is submitted
 * for human MLR review. Surfaces likely issues (off-label claims, missing
 * fair-balance, unsubstantiated comparisons) inline so reviewers can find
 * them faster.
 *
 * Output is a structured JSON snapshot stored in content_versions.ai_pre_review_notes.
 * Reviewers see this in the queue UI alongside the asset.
 */

function buildMlrPreReviewMessages({ assetTitle, productName, therapeuticArea, contentText, claims }) {
  // Same input cap as claim extraction — first 12k chars covers most decks.
  const text = (contentText || '').slice(0, 12000);
  const claimsBlock = Array.isArray(claims) && claims.length > 0
    ? '\nALREADY-EXTRACTED CLAIMS (for context):\n' + claims.map((c, i) => `${i + 1}. ${c}`).join('\n')
    : '';

  return [
    {
      role: 'system',
      content: `You are a Medical/Legal/Regulatory (MLR) compliance reviewer for pharmaceutical marketing content. Your job is to surface LIKELY ISSUES that human MLR reviewers should look at — NOT to make the final call. Err on the side of flagging.

Categorise findings into:

1. "off_label" — claims about uses, populations, dosing, or indications not in the product's approved label.
2. "missing_fair_balance" — efficacy claims presented without adequate safety/risk balance, or absent prescribing-info reference.
3. "unsubstantiated_comparison" — comparisons to a competitor or class without supporting data citation.
4. "vague_qualifier" — words like "rapid", "powerful", "best", "first-line" used without quantitative support.
5. "audience_concern" — content appears to address consumers/patients in jurisdictions where direct-to-consumer is restricted.
6. "other" — anything else worth a reviewer's attention.

Each finding has:
{
  "category": "<one of the above>",
  "severity": "low|medium|high",
  "excerpt": "<short verbatim quote from the content>",
  "explanation": "<one-sentence reviewer-actionable note>",
  "suggested_fix": "<optional: how to address it>"
}

Return JSON ONLY:
{
  "findings": [...],
  "summary": "<one-paragraph overall assessment>",
  "ready_for_human_review": true|false
}

Hard limits:
- Max 15 findings (prioritise the most important).
- Each excerpt ≤ 200 chars; each explanation ≤ 250 chars.
- If the content looks clean, return: {"findings": [], "summary": "...", "ready_for_human_review": true}
- Output ONLY valid JSON. No prose, no markdown.`
    },
    {
      role: 'user',
      content: `Asset: ${assetTitle || '(unknown)'}\nProduct: ${productName || '(no product)'}\nTherapeutic area: ${therapeuticArea || '(none)'}\n${claimsBlock}\n\n--- CONTENT TEXT ---\n${text}`
    }
  ];
}

module.exports = { buildMlrPreReviewMessages };
