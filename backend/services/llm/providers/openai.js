const BaseLLMProvider = require('../base');

/**
 * OpenAI-compatible Provider
 * Works for: OpenAI, Groq (same API shape, different base URL + key)
 *
 * Env vars:
 *   OPENAI_API_KEY  or  GROQ_API_KEY
 *   LLM_BASE_URL   (optional — set to Groq endpoint for Groq)
 *   LLM_MODEL      e.g. gpt-4o, llama-3.3-70b-versatile
 */
class OpenAIProvider extends BaseLLMProvider {
  constructor(config) {
    super(config);
    this.providerName = config.provider; // 'openai' or 'groq'

    // Lazy-load openai package so it's only required if this provider is used
    let OpenAI;
    try {
      ({ default: OpenAI } = require('openai'));
    } catch {
      throw new Error('openai package not installed. Run: npm install openai');
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || undefined, // undefined = use OpenAI default
    });
  }

  async chat(messages, options = {}) {
    const { requireJson = true, temperature } = options;
    const start = Date.now();

    const params = {
      model: this.config.model,
      messages,
      max_tokens: this.config.maxTokens || 1024,
      temperature: temperature ?? this.config.temperature ?? 0.3,
    };

    if (requireJson) {
      params.response_format = { type: 'json_object' };
    }

    const response = await this.client.chat.completions.create(params);
    const durationMs = Date.now() - start;

    this.logCall({
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
      durationMs,
    });

    const content = response.choices[0].message.content;

    if (requireJson) return this.extractJson(content);
    return { text: content };
  }
}

module.exports = OpenAIProvider;
