import { decryptApiKey } from "@/lib/ai/encryption";
import { getProviderAdapter } from "@/lib/ai/providers/registry";
import type { AIContentInput, AIContentResult, AIProviderName } from "@/lib/ai/providers/types";
import { getActiveAIConfigurationRaw } from "@/services/ai-configuration.service";

export class NoActiveAIConfigurationError extends Error {
  constructor() {
    super("No active AI configuration is set — activate one in AI Configuration before generating content");
    this.name = "NoActiveAIConfigurationError";
  }
}

export class ActiveAIConfigurationMissingApiKeyError extends Error {
  constructor() {
    super("The active AI configuration does not have an API key configured yet");
    this.name = "ActiveAIConfigurationMissingApiKeyError";
  }
}

/**
 * The single entry point for AI content generation — everything above
 * this (future Speciality "Generate Draft" endpoint, etc.) calls only this
 * function and never touches a provider adapter, the encryption module, or
 * the active-configuration lookup directly.
 *
 * Admin UI -> our API -> AI Service (this file) -> Provider Factory -> Provider Adapter -> external AI provider.
 *
 * Not wired to any route yet in this phase — the real trigger (e.g. a
 * Speciality "Generate Draft" action) is explicitly future work. This
 * exists now so that work only has to add a thin controller on top of an
 * already-correct service.
 */
export async function generateAIContent(input: AIContentInput): Promise<AIContentResult> {
  const config = await getActiveAIConfigurationRaw();

  if (!config) {
    throw new NoActiveAIConfigurationError();
  }

  if (!config.encrypted_api_key) {
    throw new ActiveAIConfigurationMissingApiKeyError();
  }

  const apiKey = decryptApiKey(config.encrypted_api_key);

  const adapter = getProviderAdapter(config.provider as AIProviderName, {
    baseUrl: config.base_url,
    model: config.model,
    apiKey,
  });

  return adapter.generateContent(input);
}
