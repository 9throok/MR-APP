/**
 * Base LLM Provider
 * All providers must extend this class and implement the chat() method.
 */
class BaseLLMProvider {
  constructor(config) {
    if (new.target === BaseLLMProvider) {
      throw new Error('BaseLLMProvider is abstract and cannot be instantiated directly');
    }
    this.config = config;
    this.providerName = 'unknown';
  }

  /**
   * Send a chat request to the LLM.
   * @param {Array<{role: string, content: string}>} messages
   * @param {Object} options
   * @param {boolean} options.requireJson - Parse response as JSON
   * @param {number} options.temperature - Override default temperature
   * @returns {Promise<Object|string>}
   */
  async chat(messages, options = {}) {
    throw new Error('chat() must be implemented by subclass');
  }

  /**
   * Extract JSON from LLM response text.
   * Handles markdown code fences and raw JSON.
   * @param {string} text
   * @returns {Object}
   */
  extractJson(text) {
    // Strip markdown code fences
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
      try { return JSON.parse(fenceMatch[1].trim()); } catch (_) {}
    }

    // Try raw parse
    try { return JSON.parse(text.trim()); } catch (_) {}

    // Find first JSON object in text
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try { return JSON.parse(objMatch[0]); } catch (_) {}
    }

    throw new Error(`Could not extract JSON from LLM response: ${text.slice(0, 300)}`);
  }

  /**
   * Log a completed API call for observability.
   * @param {Object} stats - { inputTokens, outputTokens, durationMs }
   */
  logCall(stats) {
    const { inputTokens = 0, outputTokens = 0, durationMs = 0 } = stats;
    console.log(
      `[LLM][${this.providerName}] ` +
      `in=${inputTokens} out=${outputTokens} total=${inputTokens + outputTokens} ` +
      `time=${(durationMs / 1000).toFixed(2)}s`
    );
  }
}

module.exports = BaseLLMProvider;
