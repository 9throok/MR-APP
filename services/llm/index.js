/**
 * LLM Service — Provider Factory
 *
 * Single entry point for all AI features. Reads LLM_PROVIDER from env
 * and delegates to the correct provider implementation.
 *
 * Supported providers:
 *   openai     → OpenAI (GPT-4o, etc.)
 *   groq       → Groq (Llama, Mixtral, etc.) — same API as OpenAI
 *   anthropic  → Anthropic (Claude)
 *   gemini     → Google Gemini
 *
 * Required env vars (per provider):
 *   LLM_PROVIDER=openai|groq|anthropic|gemini
 *   LLM_MODEL=<model name>
 *   LLM_MAX_TOKENS=1024           (optional, default 1024)
 *   LLM_TEMPERATURE=0.3           (optional, default 0.3)
 *
 *   OPENAI_API_KEY                (for openai)
 *   GROQ_API_KEY                  (for groq)
 *   LLM_BASE_URL                  (for groq: https://api.groq.com/openai/v1)
 *   ANTHROPIC_API_KEY             (for anthropic)
 *   GEMINI_API_KEY                (for gemini)
 */

const PROVIDERS = {
  openai:    () => require('./providers/openai'),
  groq:      () => require('./providers/openai'),   // Groq is OpenAI-compatible
  anthropic: () => require('./providers/anthropic'),
  gemini:    () => require('./providers/gemini'),
};

function buildConfig(provider) {
  const apiKeyMap = {
    openai:    process.env.OPENAI_API_KEY,
    groq:      process.env.GROQ_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    gemini:    process.env.GEMINI_API_KEY,
  };

  const apiKey = apiKeyMap[provider];
  if (!apiKey) {
    throw new Error(`Missing API key env var for provider "${provider}". ` +
      `Expected: ${provider.toUpperCase()}_API_KEY`);
  }

  return {
    provider,
    apiKey,
    model:       process.env.LLM_MODEL       || defaultModel(provider),
    maxTokens:   parseInt(process.env.LLM_MAX_TOKENS  || '1024', 10),
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.3'),
    baseUrl:     process.env.LLM_BASE_URL    || undefined,
  };
}

function defaultModel(provider) {
  const defaults = {
    openai:    'gpt-4o',
    groq:      'llama-3.3-70b-versatile',
    anthropic: 'claude-haiku-4-5-20251001',
    gemini:    'gemini-2.0-flash',
  };
  return defaults[provider] || 'gpt-4o';
}

class LLMService {
  constructor() {
    const provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase();

    if (!PROVIDERS[provider]) {
      throw new Error(
        `Unknown LLM_PROVIDER "${provider}". Valid options: ${Object.keys(PROVIDERS).join(', ')}`
      );
    }

    const config = buildConfig(provider);
    const ProviderClass = PROVIDERS[provider]();
    this.provider = new ProviderClass(config);

    console.log(`[LLMService] Initialized with provider="${provider}" model="${config.model}"`);
  }

  /**
   * Core chat method — used by all AI features.
   *
   * @param {Array<{role: 'system'|'user'|'assistant', content: string}>} messages
   * @param {Object} options
   * @param {boolean} options.requireJson  - Return parsed JSON (default: true)
   * @param {number}  options.temperature - Override temperature for this call
   * @returns {Promise<Object|{text: string}>}
   */
  async chat(messages, options = {}) {
    return this.provider.chat(messages, options);
  }
}

// Singleton — one instance per process
let _instance = null;

function getLLMService() {
  if (!_instance) {
    _instance = new LLMService();
  }
  return _instance;
}

module.exports = { getLLMService };
