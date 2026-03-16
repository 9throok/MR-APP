/**
 * Query Rewriter Service
 *
 * When conversation history exists, rewrites the user's latest query
 * to be self-contained (resolving pronouns, references to prior context).
 *
 * Example:
 *   History: "What are Derise side effects?" → "sleepy ones?"
 *   Rewritten: "Does Derise cause drowsiness or sleepiness as a side effect?"
 */

const { getLLMService } = require('./llm');

const REWRITE_PROMPT = `You are a query rewriter. Given a conversation history and the user's latest message, rewrite the latest message to be a self-contained question that can be understood without the conversation history.

Rules:
- Resolve all pronouns ("it", "this", "that", "those") to their referents
- Include the specific drug/product name if referenced earlier
- Include relevant context from prior messages (dosage, condition, etc.)
- Keep the rewritten query concise (one sentence)
- If the latest message is already self-contained, return it as-is
- Return ONLY the rewritten query text, nothing else`;

/**
 * Rewrite a query to be self-contained using conversation history
 * @param {string} currentQuery - The user's latest message
 * @param {Array<{role, content}>} conversationHistory - Prior messages
 * @returns {Promise<string>} - Rewritten self-contained query
 */
async function rewriteQuery(currentQuery, conversationHistory) {
  // Skip rewriting if no history or history is too short
  if (!conversationHistory || conversationHistory.length === 0) {
    return currentQuery;
  }

  // Check if query seems self-contained already (has a drug name or specific topic)
  const hasContext = /\b[A-Z][a-z]+\s*\d*\s*(?:mg|mcg|tablet|capsule)?\b/.test(currentQuery)
    && currentQuery.split(/\s+/).length > 4;
  if (hasContext) {
    return currentQuery;
  }

  try {
    const llm = getLLMService();

    const historyText = conversationHistory
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const messages = [
      { role: 'system', content: REWRITE_PROMPT },
      {
        role: 'user',
        content: `Conversation history:\n${historyText}\n\nLatest message: ${currentQuery}\n\nRewritten query:`
      }
    ];

    const result = await llm.chat(messages, { requireJson: false, temperature: 0.1 });
    const rewritten = (result.text || result).toString().trim();

    // Sanity check: if rewritten query is empty or too long, use original
    if (!rewritten || rewritten.length > 500) {
      return currentQuery;
    }

    console.log(`[QueryRewriter] "${currentQuery}" → "${rewritten}"`);
    return rewritten;
  } catch (err) {
    console.warn('[QueryRewriter] Rewrite failed, using original query:', err.message);
    return currentQuery;
  }
}

module.exports = { rewriteQuery };
