const BaseLLMProvider = require('../base');

/**
 * Anthropic (Claude) Provider
 *
 * Env vars:
 *   ANTHROPIC_API_KEY
 *   LLM_MODEL  e.g. claude-sonnet-4-5-20251001
 */
class AnthropicProvider extends BaseLLMProvider {
  constructor(config) {
    super(config);
    this.providerName = 'anthropic';

    let Anthropic;
    try {
      ({ default: Anthropic } = require('@anthropic-ai/sdk'));
    } catch {
      throw new Error('@anthropic-ai/sdk package not installed. Run: npm install @anthropic-ai/sdk');
    }

    this.client = new Anthropic({ apiKey: config.apiKey });
  }

  /**
   * Anthropic requires system messages to be extracted from the messages array
   * and passed as a top-level `system` param.
   */
  _splitMessages(messages) {
    const systemParts = messages
      .filter(m => m.role === 'system')
      .map(m => (typeof m.content === 'string' ? m.content : m.content[0]?.text ?? ''))
      .join('\n');

    const userAssistant = messages.filter(m => m.role !== 'system');
    return { system: systemParts, messages: userAssistant };
  }

  async chat(messages, options = {}) {
    const { requireJson = true, temperature } = options;
    const start = Date.now();

    const { system, messages: filteredMessages } = this._splitMessages(messages);

    const params = {
      model: this.config.model,
      max_tokens: this.config.maxTokens || 1024,
      temperature: temperature ?? this.config.temperature ?? 0.3,
      messages: filteredMessages,
    };

    if (system) params.system = system;

    const response = await this.client.messages.create(params);
    const durationMs = Date.now() - start;

    this.logCall({
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      durationMs,
    });

    const content = response.content[0].text;

    if (requireJson) return this.extractJson(content);
    return { text: content };
  }
}

module.exports = AnthropicProvider;
