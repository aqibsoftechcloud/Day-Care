import { z } from "zod";

export const aiConfigurationProviderSchema = z.enum(["openrouter", "gemini"]);
export const aiConfigurationStatusSchema = z.enum(["active", "inactive"]);

export const aiConfigurationIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listAIConfigurationsQuerySchema = z.object({
  provider: aiConfigurationProviderSchema.optional(),
  status: aiConfigurationStatusSchema.optional(),
});

// Syntactic validation only (well-formed https URL) — whether the hostname
// is actually one this provider is allowed to call is a cross-field check
// (depends on `provider`, which may not be part of a partial update) done
// in services/ai-configuration.service.ts, the same place Pages/Specialities
// validate `location_id` against the effective `city_id`.
const baseUrlSchema = z
  .string()
  .trim()
  .min(1, "Base URL is required")
  .max(500, "Base URL is too long")
  .url("Enter a valid URL")
  .refine((value) => value.startsWith("https://"), "Base URL must use https://");

// Accepted on input only — never echoed back. Trimmed and required to be
// non-empty when provided; omitted entirely means "leave the existing key
// untouched" (update) or "no key yet" (create).
const apiKeySchema = z.string().trim().min(1, "API key cannot be empty").max(2000, "API key is too long");

export const createAIConfigurationSchema = z.object({
  provider: aiConfigurationProviderSchema,
  base_url: baseUrlSchema,
  model: z.string().trim().min(1, "Model is required").max(255, "Model is too long"),
  api_key: apiKeySchema.optional(),
  status: aiConfigurationStatusSchema.optional(),
});

export const updateAIConfigurationSchema = z
  .object({
    provider: aiConfigurationProviderSchema.optional(),
    base_url: baseUrlSchema.optional(),
    model: z.string().trim().min(1, "Model is required").max(255, "Model is too long").optional(),
    api_key: apiKeySchema.optional(),
    status: aiConfigurationStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateAIConfigurationInput = z.infer<typeof createAIConfigurationSchema>;
export type UpdateAIConfigurationInput = z.infer<typeof updateAIConfigurationSchema>;
export type AIConfigurationIdParam = z.infer<typeof aiConfigurationIdParamSchema>;
export type ListAIConfigurationsQuery = z.infer<typeof listAIConfigurationsQuerySchema>;
