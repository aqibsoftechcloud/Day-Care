export type AIConfigurationProvider = "openrouter" | "gemini";
export type AIConfigurationStatus = "active" | "inactive";

/** Mirrors services/ai-configuration.service.ts's toSafeAIConfiguration() output — `encrypted_api_key` never leaves the server; `has_api_key` is the only signal the frontend ever gets about whether a key is stored. */
export type AIConfiguration = {
  id: number;
  provider: AIConfigurationProvider;
  base_url: string;
  model: string;
  is_active: boolean;
  status: AIConfigurationStatus;
  has_api_key: boolean;
  created_at: string;
  updated_at: string;
};

/** Mirrors validators/ai-configuration.validator.ts's createAIConfigurationSchema. `api_key` is write-only — accepted here, never present on `AIConfiguration`. */
export type CreateAIConfigurationInput = {
  provider: AIConfigurationProvider;
  base_url: string;
  model: string;
  api_key?: string;
  status?: AIConfigurationStatus;
};

/** On update, omitting `api_key` keeps the existing stored key untouched. */
export type UpdateAIConfigurationInput = Partial<CreateAIConfigurationInput>;
