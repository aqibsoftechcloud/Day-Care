import { z } from "zod";

export const treatmentFaqStatusSchema = z.enum(["active", "inactive"]);

export const treatmentFaqIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listTreatmentFaqsQuerySchema = z.object({
  treatment_id: z.coerce.number().int().positive().optional(),
  status: treatmentFaqStatusSchema.optional(),
});

export const createTreatmentFaqSchema = z.object({
  treatment_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1, "Title is required").max(255),
  text: z.string().trim().min(1, "Text is required"),
  status: treatmentFaqStatusSchema.optional(),
});

export const updateTreatmentFaqSchema = createTreatmentFaqSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateTreatmentFaqInput = z.infer<typeof createTreatmentFaqSchema>;
export type UpdateTreatmentFaqInput = z.infer<typeof updateTreatmentFaqSchema>;
export type TreatmentFaqIdParam = z.infer<typeof treatmentFaqIdParamSchema>;
export type ListTreatmentFaqsQuery = z.infer<
  typeof listTreatmentFaqsQuerySchema
>;
