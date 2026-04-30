/**
 * Content Recommender Prompt — Phase B "CLM NBA"
 *
 * Given an MR's upcoming visits + doctor profiles + visit history + the org's
 * published content library + the MR's recent content_views, recommend the
 * single best detail aid (or 2-3) to show each doctor on the next visit.
 *
 * Output shape mirrors the NBA recommendations array so the frontend can reuse
 * card components.
 */

function buildContentRecommenderMessages({
  userId,
  dayOfWeek,
  upcomingDoctors,    // [{ doctorName, specialty, tier, lastVisitDate, productsRecentlyDiscussed }]
  publishedAssets,    // [{ id, title, asset_type, product_name, therapeutic_area, description }]
  recentViews,        // [{ assetTitle, doctorName, totalSeconds, slideCount, viewedAt }]
}) {
  const docCtx = (upcomingDoctors || []).slice(0, 30).map(d =>
    `- ${d.doctorName} | Specialty: ${d.specialty || 'N/A'} | Tier: ${d.tier || '?'} | Last visit: ${d.lastVisitDate || 'never'} | Recent products: ${d.productsRecentlyDiscussed || 'N/A'}`
  ).join('\n') || '(no upcoming doctors found)';

  const assetCtx = (publishedAssets || []).slice(0, 50).map(a =>
    `- [id:${a.id}] "${a.title}" | Type: ${a.asset_type} | Product: ${a.product_name || 'cross-product'} | Area: ${a.therapeutic_area || 'general'} | ${a.description ? a.description.slice(0, 120) : ''}`
  ).join('\n') || '(no published assets in library)';

  const viewCtx = (recentViews || []).slice(0, 20).map(v =>
    `- "${v.assetTitle}" shown to ${v.doctorName || 'unknown'} for ${v.totalSeconds}s (${v.slideCount} slides) on ${v.viewedAt}`
  ).join('\n') || '(no recent content views)';

  return [
    {
      role: 'system',
      content: `You are a CLM (Closed-Loop Marketing) AI advisor for pharmaceutical medical reps. For each upcoming doctor visit, recommend the most relevant published detail aid (or 2-3) the MR should plan to show.

Ranking signals (most important first):
1. **Therapeutic relevance** — match the asset's therapeutic_area or product to the doctor's specialty + recently-discussed products.
2. **Freshness** — favor assets the doctor has NOT seen recently. If recent_views shows the same asset already shown to this doctor, prefer something else unless there's a clear reason (e.g. follow-up on a specific objection).
3. **Tier discipline** — for tier-A doctors, prioritise data-rich slide decks; for tier-C, prefer shorter brochures.
4. **Visit type** — if this is a re-engagement after a long gap, propose an "Updates / new data" deck if available.

Return JSON ONLY:
{
  "recommendations": [
    {
      "rank": 1,
      "doctor": "Dr. Name",
      "specialty": "...",
      "tier": "A|B|C",
      "priority": "high|medium|low",
      "recommended_assets": [
        {
          "asset_id": <integer asset id from the library>,
          "title": "<asset title>",
          "why": "<1-2 sentence rationale tied to this specific doctor>"
        }
      ],
      "talking_points": ["...", "..."],
      "best_time": "<suggested time, optional>"
    }
  ],
  "library_insight": "<1-2 sentence note about content gaps or patterns>",
  "total_recommended": <integer>
}

Hard limits:
- Recommend assets ONLY by asset_id from the library above. Do NOT invent ids.
- Each doctor: 1-3 recommended_assets max.
- Output up to 8 doctor recommendations max — pick the most impactful.
- Output ONLY valid JSON. No prose, no markdown.`
    },
    {
      role: 'user',
      content: `MR: ${userId}\nToday: ${dayOfWeek}\n\nUPCOMING DOCTORS:\n${docCtx}\n\nPUBLISHED CONTENT LIBRARY (only these assets are publishable):\n${assetCtx}\n\nRECENT CONTENT VIEWS:\n${viewCtx}`
    }
  ];
}

module.exports = { buildContentRecommenderMessages };
