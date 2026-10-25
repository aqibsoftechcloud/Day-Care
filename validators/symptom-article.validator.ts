import { z } from "zod";

export const symptomArticleStatusSchema = z.enum(["active", "inactive"]);

export const symptomArticleIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listSymptomArticlesQuerySchema = z.object({
  part_id: z.coerce.number().int().positive().optional(),
  symptom_id: z.coerce.number().int().positive().optional(),
  status: symptomArticleStatusSchema.optional(),
});

// part_id and symptom_id are validated independently (each must
// reference an existing row) — no cross-consistency rule requiring the
// symptom to actually belong to the given part is enforced, since the
// schema stores both as separate, independent FKs and no requirement
// calls for that extra check. See report for reasoning.
export const createSymptomArticleSchema = z.object({
  article_name: z
    .string()
    .trim()
    .min(1, "Article name is required")
    .max(255),
  part_id: z.coerce.number().int().positive(),
  symptom_id: z.coerce.number().int().positive(),
  meta_title: z.string().trim().max(255).nullable().optional(),
  meta_description: z.string().trim().nullable().optional(),
  meta_keywords: z.string().trim().max(500).nullable().optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255),
  // Not trimmed: LongText CMS content, stored exactly as submitted.
  description: z.string().nullable().optional(),
  status: symptomArticleStatusSchema.optional(),
});

export const updateSymptomArticleSchema = createSymptomArticleSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateSymptomArticleInput = z.infer<
  typeof createSymptomArticleSchema
>;
export type UpdateSymptomArticleInput = z.infer<
  typeof updateSymptomArticleSchema
>;
export type SymptomArticleIdParam = z.infer<
  typeof symptomArticleIdParamSchema
>;
export type ListSymptomArticlesQuery = z.infer<
  typeof listSymptomArticlesQuerySchema
>;
