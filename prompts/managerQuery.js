/**
 * Prompt: Manager Natural Language Query
 *
 * Allows managers to ask free-form questions about their team's DCR data.
 * The LLM analyses the data and answers in plain English.
 *
 * Input context:
 *   - managerQuery: string (the question the manager typed)
 *   - teamData: Array of DCR records for all MRs under this manager
 *   - mrList: Array of { user_id, name } for the team
 *
 * Output (JSON):
 *   {
 *     answer: string,          // Direct answer to the question
 *     supportingData: [],      // Key data points that back the answer
 *     followUpSuggestions: []  // 2-3 related questions the manager might want to ask next
 *   }
 */

function buildManagerQueryMessages(managerQuery, teamData, mrList = []) {
  const mrMap = Object.fromEntries(mrList.map(m => [m.user_id, m.name]));

  const dataText = teamData.length === 0
    ? 'No DCR data available for the team.'
    : teamData.map(dcr => {
        const mrName = mrMap[dcr.user_id] || dcr.user_id;
        return [
          `[${dcr.date}] MR: ${mrName} | Doctor: ${dcr.name} | Product: ${dcr.product}`,
          `  Samples: ${dcr.samples ?? 0} | Rating: ${dcr.rating}/5`,
          `  Notes: ${dcr.call_summary || 'None'}`,
        ].join('\n');
      }).join('\n');

  const system = `You are an intelligent pharmaceutical sales analytics assistant for a team manager.
You have access to DCR (Daily Call Report) data for the manager's entire team.
Answer the manager's question accurately and concisely using only the data provided.
Always respond with valid JSON only.`;

  const user = `Manager's question: "${managerQuery}"

TEAM DCR DATA:
${dataText}

Answer the manager's question using the data above. Return:
{
  "answer": "Direct, clear answer in 2-4 sentences",
  "supportingData": [
    "Specific data point 1 that supports the answer",
    "Specific data point 2"
  ],
  "followUpSuggestions": [
    "A related question the manager might want to ask next",
    "Another useful follow-up question"
  ]
}

Rules:
- Be specific — use names, numbers, dates from the data
- If the data doesn't support answering the question, say so clearly in the answer field
- supportingData should be concrete facts (e.g. "Rahul made 12 calls this month vs team avg of 8")
- followUpSuggestions should be genuinely useful next questions`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

module.exports = { buildManagerQueryMessages };
