import { z } from "zod";

export const symptomPartStatusSchema = z.enum(["active", "inactive"]);

export const symptomPartIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listSymptomPartsQuerySchema = z.object({
  status: symptomPartStatusSchema.optional(),
});

export const createSymptomPartSchema = z.object({
  part_name: z.string().trim().min(1, "Part name is required").max(255),
  meta_title: z.string().trim().max(255).nullable().optional(),
  meta_description: z.string().trim().nullable().optional(),
  meta_keywords: z.string().trim().max(500).nullable().optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255),
  // Not trimmed: LongText CMS content, stored exactly as submitted.
  part_description: z.string().nullable().optional(),
  status: symptomPartStatusSchema.optional(),
});

export const updateSymptomPartSchema = createSymptomPartSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateSymptomPartInput = z.infer<typeof createSymptomPartSchema>;
export type UpdateSymptomPartInput = z.infer<typeof updateSymptomPartSchema>;
export type SymptomPartIdParam = z.infer<typeof symptomPartIdParamSchema>;
export type ListSymptomPartsQuery = z.infer<
  typeof listSymptomPartsQuerySchema
>;
