/**
 * Prompt: Product Performance Signals
 *
 * Analyses DCR data to surface which products are performing well or poorly.
 * Useful for managers and for feeding back to marketing.
 *
 * Input context:
 *   - productStats: Array of {
 *       product, totalCalls, avgRating, totalSamples,
 *       lowRatingCalls, highRatingCalls, uniqueDoctors, uniqueMRs
 *     }
 *   - period: string (e.g. "March 2025", "Last 30 days")
 *
 * Output (JSON):
 *   {
 *     topPerformers: [{ product, reason }],
 *     underperformers: [{ product, concern, suggestion }],
 *     signals: string[],
 *     summary: string
 *   }
 */

function buildProductSignalsMessages(productStats, period = 'the selected period') {
  const statsText = productStats.length === 0
    ? 'No product data available.'
    : productStats.map(p => [
        `Product: ${p.product}`,
        `  Total calls: ${p.totalCalls} | Unique doctors: ${p.uniqueDoctors} | Unique MRs: ${p.uniqueMRs}`,
        `  Avg rating: ${p.avgRating ? parseFloat(p.avgRating).toFixed(2) : 'N/A'}/5`,
        `  Samples distributed: ${p.totalSamples ?? 0}`,
        `  High-rated calls (4-5): ${p.highRatingCalls} | Low-rated calls (1-2): ${p.lowRatingCalls}`,
      ].join('\n')).join('\n\n');

  const system = `You are a pharmaceutical sales performance analyst. 
You identify product-level trends from field sales data (DCRs) and surface actionable signals for management.
Always respond with valid JSON only.`;

  const user = `Analyse product performance for ${period}.

PRODUCT STATS:
${statsText}

Return a JSON object with this structure:
{
  "topPerformers": [
    {
      "product": "product name",
      "reason": "why it's doing well — e.g. high avg rating across many doctors, strong sampling uptake"
    }
  ],
  "underperformers": [
    {
      "product": "product name",
      "concern": "what the data shows — e.g. low avg rating, low sample uptake despite many calls",
      "suggestion": "one actionable suggestion for the field team or management"
    }
  ],
  "signals": [
    "Interesting pattern 1 worth flagging",
    "Interesting pattern 2"
  ],
  "summary": "2-3 sentence overall product performance summary for ${period}"
}

Rules:
- topPerformers: products with consistently high ratings and/or strong doctor reach
- underperformers: products with low avg ratings or high low-rating call ratio
- signals: unexpected patterns (e.g. a product with many calls but zero samples suggests reluctance)
- Be specific — include product names and numbers in reasons/concerns`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

module.exports = { buildProductSignalsMessages };