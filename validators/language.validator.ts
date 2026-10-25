import { z } from "zod";

export const languageStatusSchema = z.enum(["active", "inactive"]);

export const languageIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createLanguageSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255),
  status: languageStatusSchema.optional(),
});

export const updateLanguageSchema = createLanguageSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export type CreateLanguageInput = z.infer<typeof createLanguageSchema>;
export type UpdateLanguageInput = z.infer<typeof updateLanguageSchema>;
export type LanguageIdParam = z.infer<typeof languageIdParamSchema>;
