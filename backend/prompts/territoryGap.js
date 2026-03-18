/**
 * Prompt: Territory Gap Finder
 *
 * Input context:
 *   - mrName: string
 *   - doctorStats: Array of { doctorName, lastVisitDate, totalVisits, avgRating, daysSinceLastVisit }
 *   - thresholdDays: number (doctors not visited for this many days are flagged)
 *
 * Output (JSON):
 *   {
 *     coldDoctors: [{ name, daysSince, urgency, reason }],
 *     atRiskDoctors: [{ name, daysSince, concern }],
 *     insight: string,
 *     recommendation: string
 *   }
 */

function buildTerritoryGapMessages(mrName, doctorStats, thresholdDays = 30) {
  const statsText = doctorStats.length === 0
    ? 'No visit data available.'
    : doctorStats.map(d => [
        `Doctor: ${d.doctorName}`,
        `  Last visit: ${d.lastVisitDate} (${d.daysSinceLastVisit} days ago)`,
        `  Total visits: ${d.totalVisits}`,
      ].join('\n')).join('\n\n');

  const system = `You are a pharmaceutical sales territory analyst. You identify gaps in an MR's coverage — doctors who are being neglected or are at risk of disengagement.
Always respond with valid JSON only.
Write in simple, everyday English — short sentences, no jargon. The reader is a field sales rep, not an analyst.`;

  const user = `Analyse the territory coverage for MR: ${mrName}

Threshold: Doctors not visited in ${thresholdDays}+ days should be flagged.

DOCTOR VISIT STATS:
${statsText}

Return a JSON object with this structure:
{
  "coldDoctors": [
    {
      "name": "doctor name",
      "daysSince": 45,
      "urgency": "high|medium|low",
      "reason": "why this matters — e.g. you used to visit often but haven't been in a while"
    }
  ],
  "atRiskDoctors": [
    {
      "name": "doctor name",
      "daysSince": 22,
      "concern": "getting close to overdue — visits have been dropping off"
    }
  ],
  "insight": "1-2 sentence pattern observation across the territory",
  "recommendation": "1-2 sentence prioritised action for the MR this week"
}

Rules:
- coldDoctors: visited ${thresholdDays}+ days ago — rank by urgency (consider visit frequency and engagement)
- atRiskDoctors: 15-${thresholdDays - 1} days ago with warning signs (declining visits, low engagement)
- urgency: "high" if previously frequent and now cold, "medium" otherwise, "low" if low-value contact
- Keep all text concise — this is a field briefing, not a report`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

module.exports = { buildTerritoryGapMessages };