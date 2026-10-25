import { AIProviderNotConfiguredError, type AIContentInput, type AIContentResult, type AIProvider, type AIProviderConfig } from "./types";

/**
 * OpenRouter adapter — structured for the real integration (constructor
 * takes the real baseUrl/model/apiKey resolved by the AI service), but
 * `generateContent` deliberately does not call the network yet. Per this
 * phase's explicit scope: no real provider calls, no hardcoded credentials,
 * a controlled/explicit "not yet implemented" boundary instead of a silent
 * no-op or a fake response.
 */
export class OpenRouterProvider implements AIProvider {
  constructor(private readonly config: AIProviderConfig) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by the AIProvider interface; unused until the real call is implemented.
  async generateContent(input: AIContentInput): Promise<AIContentResult> {
    throw new AIProviderNotConfiguredError("openrouter");
  }
}
