import { GeminiProvider } from "./gemini.provider";
import { OpenRouterProvider } from "./openrouter.provider";
import type { AIProvider, AIProviderConfig, AIProviderName } from "./types";

/**
 * SSRF guard (not a UI nicety): every `base_url` an admin saves is
 * validated against this allowlist server-side (validators/ai-configuration.validator.ts)
 * before it's ever persisted, and the provider adapters only ever receive
 * an already-validated base_url. There is deliberately no code path that
 * fetches an arbitrary admin-supplied URL — only these known hosts, over
 * HTTPS, are ever reachable through this architecture.
 */
export const PROVIDER_HOST_ALLOWLIST: Record<AIProviderName, string[]> = {
  openrouter: ["openrouter.ai"],
  gemini: ["generativelanguage.googleapis.com"],
};

export const PROVIDER_DEFAULT_BASE_URL: Record<AIProviderName, string> = {
  openrouter: "https://openrouter.ai/api/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
};

export class UnknownAIProviderError extends Error {
  constructor(provider: string) {
    super(`Unknown AI provider: ${provider}`);
    this.name = "UnknownAIProviderError";
  }
}

/** The one place that maps a `provider` value to its concrete adapter — services/ai.service.ts never imports a provider class directly. */
export function getProviderAdapter(provider: AIProviderName, config: AIProviderConfig): AIProvider {
  switch (provider) {
    case "openrouter":
      return new OpenRouterProvider(config);
    case "gemini":
      return new GeminiProvider(config);
    default: {
      const exhaustiveCheck: never = provider;
      throw new UnknownAIProviderError(String(exhaustiveCheck));
    }
  }
}
