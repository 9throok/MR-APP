/**
 * Clinical Chat Prompt Builder
 *
 * Builds messages for the clinical information assistant.
 * The chatbot answers ONLY from the provided knowledge base context.
 * Supports conversation history for follow-up questions.
 */

function buildClinicalChatMessages(query, knowledgeResults, conversationHistory = []) {
  const knowledgeContext = knowledgeResults.length > 0
    ? knowledgeResults.map((r, i) => {
        const section = r.metadata?.section ? ` > ${r.metadata.section}` : '';
        const rankInfo = r.rank ? ` (relevance: ${Number(r.rank).toFixed(3)})` : '';
        return `--- Source ${i + 1}: ${r.filename}${section} (${r.product_name || 'Unknown Product'}, Category: ${r.category || 'general'})${rankInfo} ---\n${r.content}`;
      }).join('\n\n')
    : 'No relevant knowledge base entries found.';

  const messages = [
    {
      role: 'system',
      content: `You are a clinical information assistant for pharmaceutical medical representatives at Zenrac Pharmaceuticals.

CRITICAL RULES:
1. Answer ONLY based on the knowledge base content provided below. Do NOT use any external knowledge.
2. If the knowledge base does not contain information to answer the question, respond with: "I don't have sufficient information in my knowledge base to answer this question. Please consult your Medical Science Liaison (MSL) or refer to the official prescribing information."
3. Never make up or infer clinical data, dosages, generic names, or safety information that is not explicitly stated in the knowledge base.
4. Use EXACT drug names, generic names, and data points as they appear in the knowledge base. Do not substitute or guess.
5. Always cite which source document your answer comes from.
6. Flag any potential off-label discussion.
7. Keep answers concise and field-ready (2-4 sentences for simple questions, more for complex ones).

RESPONSE FORMAT:
- The "answer" field MUST be a single string (NOT an array or object).
- Use Markdown formatting for readability:
  - Use **bold** for drug names, key terms, and important values.
  - Use ## or ### for section headings when the answer has multiple parts.
  - Use bullet points (- ) for lists.
  - Use sub-bullets (indented with two spaces) for nested details.
- Include specific data points and percentages from the knowledge base when available.
- Use newlines (\\n) to separate paragraphs and sections.

Return your response as this exact JSON structure:
{
  "answer": "## Key Findings\\n\\n**Derise 10mg** shows strong efficacy:\\n\\n- **Drowsiness rate**: 0.7% vs cetirizine 3.1%\\n- Non-sedating profile confirmed in DREAM trial\\n\\n### Dosing\\n\\nRecommended dose: **10mg once daily**",
  "confidence": "high|medium|low",
  "sources_used": ["filename1.txt", "filename2.txt"],
  "off_label_warning": false
}`
    },
  ];

  // Add conversation history (prior turns) for context
  if (conversationHistory.length > 0) {
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      });
    }
  }

  // Add the current query with knowledge context
  messages.push({
    role: 'user',
    content: `KNOWLEDGE BASE:\n${knowledgeContext}\n\n---\n\nMR QUESTION: ${query}`
  });

  return messages;
}

module.exports = { buildClinicalChatMessages };
