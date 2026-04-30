/**
 * Claim Extraction Prompt
 *
 * Phase B Claim Substantiation feature: extracts marketing claims from a piece
 * of content text (detail aid, slide deck, brochure) so we can later look them
 * up against the `drug_knowledge` source documents.
 *
 * The output is a flat array of short claim strings. We deliberately keep the
 * shape minimal — the substantiation step downstream calls knowledgeSearch()
 * once per claim and decides citation status from RAG match scores.
 */

function buildClaimExtractionMessages({ assetTitle, productName, therapeuticArea, contentText }) {
  // Cap the input text. LLMs handle ~30-50k tokens fine but we don't need
  // the whole document for claim extraction — the first 12k characters of a
  // typical detail aid / brochure already contain almost all the claims.
  const text = (contentText || '').slice(0, 12000);

  return [
    {
      role: 'system',
      content: `You are a pharmaceutical marketing-content reviewer. Extract every distinct PROMOTIONAL CLAIM from the provided content.

A "promotional claim" is any statement that promotes the product's efficacy, safety, convenience, or superiority and would need to be substantiated against the product's clinical evidence (trials, label, IFU). Examples:
- "38% reduction in Total Symptom Score vs placebo"
- "Once-daily dosing improves compliance"
- "Better tolerated than cetirizine"

NOT a claim — do not extract these:
- General drug-class facts ("antihistamines block H1 receptors")
- Disease-state context ("Allergic rhinitis affects 20% of adults")
- Logistics ("Available in 10mg and 20mg strengths")
- Dosing instructions ("Take once daily")
- Boilerplate fair-balance language ("See full prescribing information")

Return JSON ONLY:
{
  "claims": [
    "<exact claim sentence as written, lightly cleaned of bullet markers and trailing whitespace>",
    ...
  ]
}

Hard limits:
- Maximum 25 claims. Pick the most distinct/important if there are more.
- Each claim ≤ 200 characters. Trim quotes, remove leading bullet symbols.
- Output ONLY valid JSON. No prose, no markdown.

If the content has no promotional claims, return: {"claims": []}`
    },
    {
      role: 'user',
      content: `Asset: ${assetTitle || '(unknown)'}\nProduct: ${productName || '(no product)'}\nTherapeutic area: ${therapeuticArea || '(none)'}\n\n--- CONTENT TEXT ---\n${text}`
    }
  ];
}

module.exports = { buildClaimExtractionMessages };
