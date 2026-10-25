/** The set of providers this architecture currently has an adapter for — kept in sync with the `ai_configurations_provider` Prisma enum. */
export type AIProviderName = "openrouter" | "gemini";

export type AIProviderConfig = {
  baseUrl: string;
  model: string;
  apiKey: string;
};

export type AIContentInput = {
  /** The instruction/prompt sent to the model — e.g. "Write a short description for the Cardiology speciality." */
  prompt: string;
  /** Optional system-level instruction, kept separate from `prompt` since providers expose it differently. */
  systemPrompt?: string;
  /** Optional JSON-schema hint for providers that support structured output (Gemini does, via generationConfig.responseSchema). Providers that don't support it simply ignore this field. */
  responseSchema?: Record<string, unknown>;
};

export type AIContentResult = {
  text: string;
  provider: AIProviderName;
  model: string;
};

export class AIProviderNotConfiguredError extends Error {
  constructor(provider: AIProviderName) {
    super(`The ${provider} integration is not yet implemented — this is a foundation-only adapter.`);
    this.name = "AIProviderNotConfiguredError";
  }
}

/**
 * A provider adapter's own request failed — bad credentials, rate limit,
 * timeout, malformed/blocked response, etc. The message is always a
 * hand-built, safe string; adapters must never put the raw provider
 * response body or the API key into this message.
 */
export class AIProviderRequestError extends Error {
  constructor(provider: AIProviderName, message: string) {
    super(`${provider} request failed: ${message}`);
    this.name = "AIProviderRequestError";
  }
}

/**
 * The one interface every provider adapter implements — the AI service
 * (services/ai.service.ts) and everything above it only ever talks to
 * this, never to a provider's SDK/HTTP API directly.
 */
export interface AIProvider {
  generateContent(input: AIContentInput): Promise<AIContentResult>;
}
