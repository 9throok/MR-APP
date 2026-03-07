const BaseLLMProvider = require('../base');

/**
 * Google Gemini Provider
 *
 * Env vars:
 *   GEMINI_API_KEY
 *   LLM_MODEL  e.g. gemini-2.0-flash
 */
class GeminiProvider extends BaseLLMProvider {
  constructor(config) {
    super(config);
    this.providerName = 'gemini';

    let genAI;
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      genAI = new GoogleGenerativeAI(config.apiKey);
    } catch {
      throw new Error('@google/generative-ai package not installed. Run: npm install @google/generative-ai');
    }

    this.genAI = genAI;
    this.modelName = config.model || 'gemini-2.0-flash';
    this.config = config;
  }

  /**
   * Convert OpenAI-style messages to Gemini format.
   * Gemini uses { role: 'user'|'model', parts: [{text}] }
   * System messages become a system instruction on the model instance.
   */
  _convertMessages(messages) {
    let systemInstruction = '';
    const contents = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction += (typeof msg.content === 'string' ? msg.content : msg.content[0]?.text ?? '') + '\n';
        continue;
      }

      const role = msg.role === 'assistant' ? 'model' : 'user';
      const text = typeof msg.content === 'string' ? msg.content : msg.content.map(p => p.text ?? '').join('');
      contents.push({ role, parts: [{ text }] });
    }

    return { systemInstruction: systemInstruction.trim(), contents };
  }

  async chat(messages, options = {}) {
    const { requireJson = true, temperature } = options;
    const start = Date.now();

    const { systemInstruction, contents } = this._convertMessages(messages);

    const modelConfig = {
      model: this.modelName,
      generationConfig: {
        temperature: temperature ?? this.config.temperature ?? 0.3,
        maxOutputTokens: this.config.maxTokens || 1024,

      },
    };

    if (systemInstruction) {
      modelConfig.systemInstruction = systemInstruction;
    }

    const model = this.genAI.getGenerativeModel(modelConfig, { apiVersion: 'v1beta' });
    const result = await model.generateContent({ contents });
    const durationMs = Date.now() - start;

    const usageMeta = result.response.usageMetadata;
    this.logCall({
      inputTokens: usageMeta?.promptTokenCount ?? 0,
      outputTokens: usageMeta?.candidatesTokenCount ?? 0,
      durationMs,
    });

    const content = result.response.text();

    if (requireJson) return this.extractJson(content);
    return { text: content };
  }
}

module.exports = GeminiProvider;