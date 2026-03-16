/**
 * Prompt: Competitor Intelligence
 *
 * Combines DCR call summaries (competitor mentions) and RCPA data
 * (prescription audit) to generate actionable competitor insights
 * for marketing and field strategy teams.
 *
 * Input context:
 *   - dcrMentions: Array of { doctor_name, product, call_summary, doctor_feedback, date }
 *   - rcpaStats: Array of { competitor_company, competitor_brand, total_value, our_brand, our_value, pharmacy_count, doctor_count }
 *   - period: string
 *
 * Output (JSON):
 *   {
 *     topCompetitors: [{ company, mentions, brands[], threat_level, key_insight }],
 *     competitorBySegment: [{ segment, our_brand, competitor_brand, competitor_company, insight }],
 *     doctorFeedbackThemes: [{ theme, frequency, example, action }],
 *     marketShareInsights: [{ our_brand, competitor_brand, competitor_company, our_value, competitor_value, gap_pct, recommendation }],
 *     strategicRecommendations: string[],
 *     summary: string
 *   }
 */

function buildCompetitorIntelMessages(dcrMentions, rcpaStats, period = 'the selected period') {
  const dcrText = dcrMentions.length === 0
    ? 'No DCR data with competitor mentions found.'
    : dcrMentions.map((d, i) => [
        `--- DCR #${i + 1} ---`,
        `Doctor: ${d.name} | Product Detailed: ${d.product} | Date: ${d.date}`,
        `Call Summary: ${d.call_summary || 'N/A'}`,
        `Doctor Feedback: ${d.doctor_feedback || 'N/A'}`,
      ].join('\n')).join('\n\n');

  const rcpaText = rcpaStats.length === 0
    ? 'No RCPA prescription audit data available.'
    : rcpaStats.map((r, i) => [
        `--- RCPA #${i + 1} ---`,
        `Competitor: ${r.competitor_brand} (${r.competitor_company || 'Unknown'})`,
        `vs Our Brand: ${r.our_brand}`,
        `Competitor Rx Value: ${r.total_competitor_value} | Our Rx Value: ${r.total_our_value}`,
        `Pharmacies: ${r.pharmacy_count} | Doctors: ${r.doctor_count}`,
      ].join('\n')).join('\n\n');

  const system = `You are a pharmaceutical competitive intelligence analyst at Zenrac Pharmaceuticals.
You analyse field sales data (DCR call reports where MRs mention competitor products and doctor feedback)
and RCPA data (prescription audits showing competitor vs our brand prescription values at pharmacies)
to generate actionable competitor intelligence for marketing and strategy teams.
Always respond with valid JSON only.`;

  const user = `Analyse competitor landscape for ${period}.

DATA SOURCE 1 — DCR CALL REPORTS (competitor mentions from doctor visits):
${dcrText}

DATA SOURCE 2 — RCPA PRESCRIPTION AUDITS (pharmacy-level prescription data):
${rcpaText}

Return a JSON object with this structure:
{
  "topCompetitors": [
    {
      "company": "competitor company name",
      "mentions": 5,
      "brands": ["brand1", "brand2"],
      "threat_level": "high|medium|low",
      "key_insight": "why this competitor is significant — pricing, availability, doctor preference, etc."
    }
  ],
  "competitorBySegment": [
    {
      "segment": "therapeutic segment name (e.g. Antihistamines, Antihypertensives, Respiratory)",
      "our_brand": "our product",
      "competitor_brand": "their product",
      "competitor_company": "company name",
      "insight": "how competitor is positioned vs us in this segment"
    }
  ],
  "doctorFeedbackThemes": [
    {
      "theme": "e.g. Price sensitivity, Availability, Clinical evidence",
      "frequency": "how often this theme appears",
      "example": "representative quote or paraphrase from doctor feedback",
      "action": "recommended action for marketing team"
    }
  ],
  "marketShareInsights": [
    {
      "our_brand": "our product",
      "competitor_brand": "their product",
      "competitor_company": "company name",
      "our_value": 100,
      "competitor_value": 250,
      "gap_pct": 60,
      "recommendation": "specific action to close the gap"
    }
  ],
  "strategicRecommendations": [
    "Actionable recommendation 1 for marketing team",
    "Actionable recommendation 2 for field force",
    "Actionable recommendation 3 for pricing team"
  ],
  "summary": "3-4 sentence executive summary of the competitive landscape for ${period}"
}

Rules:
- topCompetitors: rank by combined DCR mentions + RCPA presence. Include threat_level (high if >30% share or aggressive pricing)
- competitorBySegment: group analysis by therapeutic area (Antihistamines for Derise, Respiratory for Rilast, Antihypertensives for Bevaas)
- doctorFeedbackThemes: extract common themes from doctor feedback about competitors (price, efficacy, availability, CME support)
- marketShareInsights: use RCPA data to calculate prescription value gaps. gap_pct = (competitor_value - our_value) / competitor_value * 100
- strategicRecommendations: be specific and actionable — mention product names, competitor names, and concrete actions
- Be specific — include product names, competitor names, and numbers in all insights`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

module.exports = { buildCompetitorIntelMessages };
