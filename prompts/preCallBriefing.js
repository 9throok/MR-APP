/**
 * Prompt: Pre-Call Briefing
 *
 * Input context:
 *   - doctorName: string
 *   - mrName: string (optional)
 *   - dcrHistory: Array of DCR records for this doctor, sorted most-recent first
 *
 * Output (JSON):
 *   {
 *     summary: string,           // 2-3 line recap of relationship so far
 *     lastVisit: string,         // Date of last visit + what happened
 *     pendingItems: string[],    // Unresolved questions/actions from past visits
 *     talkingPoints: string[],   // Suggested focus areas for today
 *     watchOut: string[]         // Objections or sensitivities to be aware of
 *   }
 */

function buildPreCallBriefingMessages(doctorName, dcrHistory, mrName = '') {
  const mrLabel = mrName ? ` for MR ${mrName}` : '';

  const historyText = dcrHistory.length === 0
    ? 'No previous visits recorded for this doctor.'
    : dcrHistory.map((dcr, i) => {
        return [
          `Visit ${i + 1} — Date: ${dcr.date}`,
          `  Product: ${dcr.product}`,
          `  Samples given: ${dcr.samples ?? 'None'}`,
          `  Rating: ${dcr.rating}/5`,
          `  Summary: ${dcr.call_summary || 'No summary provided'}`,
        ].join('\n');
      }).join('\n\n');

  const system = `You are an expert pharmaceutical sales coach. Your job is to prepare Medical Representatives (MRs) for their upcoming doctor visits.
Analyse the visit history provided and return a concise, actionable pre-call briefing.
Always respond with valid JSON only — no markdown, no explanation outside JSON.`;

  const user = `Prepare a pre-call briefing${mrLabel} for an upcoming visit to Dr. ${doctorName}.

VISIT HISTORY (most recent first):
${historyText}

Return a JSON object with this exact structure:
{
  "summary": "2-3 sentence overview of the relationship with this doctor so far",
  "lastVisit": "One sentence on what happened in the most recent visit",
  "pendingItems": ["item1", "item2"],
  "talkingPoints": ["point1", "point2", "point3"],
  "watchOut": ["concern1", "concern2"]
}

Rules:
- pendingItems: questions the doctor raised or actions promised but not confirmed yet
- talkingPoints: 2-4 specific things to push in this visit based on history
- watchOut: objections, sensitivities, or patterns that need careful handling
- If history is sparse, use reasonable defaults for a first/early-stage relationship
- Keep each item to 1-2 sentences max — this will be read 5 minutes before the visit`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

module.exports = { buildPreCallBriefingMessages };
