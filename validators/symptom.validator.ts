import { z } from "zod";

export const symptomStatusSchema = z.enum(["active", "inactive"]);

export const symptomIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listSymptomsQuerySchema = z.object({
  part_id: z.coerce.number().int().positive().optional(),
  status: symptomStatusSchema.optional(),
});

export const createSymptomSchema = z.object({
  part_id: z.coerce.number().int().positive(),
  symptom_name: z
    .string()
    .trim()
    .min(1, "Symptom name is required")
    .max(255),
  status: symptomStatusSchema.optional(),
});

export const updateSymptomSchema = createSymptomSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateSymptomInput = z.infer<typeof createSymptomSchema>;
export type UpdateSymptomInput = z.infer<typeof updateSymptomSchema>;
export type SymptomIdParam = z.infer<typeof symptomIdParamSchema>;
export type ListSymptomsQuery = z.infer<typeof listSymptomsQuerySchema>;
