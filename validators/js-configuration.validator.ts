import { z } from "zod";

export const jsConfigurationConfigForSchema = z.enum(["header", "footer"]);
export const jsConfigurationStatusSchema = z.enum(["active", "inactive"]);

export const jsConfigurationIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listJsConfigurationsQuerySchema = z.object({
  config_for: jsConfigurationConfigForSchema.optional(),
  status: jsConfigurationStatusSchema.optional(),
});

export const createJsConfigurationSchema = z.object({
  config_for: jsConfigurationConfigForSchema,
  config_type: z
    .string()
    .trim()
    .min(1, "Config type is required")
    .max(100),
  // Not trimmed: stored/executed code, preserved exactly as submitted.
  config_code: z.string().min(1, "Config code is required"),
  status: jsConfigurationStatusSchema.optional(),
});

export const updateJsConfigurationSchema = createJsConfigurationSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateJsConfigurationInput = z.infer<
  typeof createJsConfigurationSchema
>;
export type UpdateJsConfigurationInput = z.infer<
  typeof updateJsConfigurationSchema
>;
export type JsConfigurationIdParam = z.infer<
  typeof jsConfigurationIdParamSchema
>;
export type ListJsConfigurationsQuery = z.infer<
  typeof listJsConfigurationsQuerySchema
>;
