import { z } from "zod";

export const globalTreatmentFaqStatusSchema = z.enum(["active", "inactive"]);

export const globalTreatmentFaqIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listGlobalTreatmentFaqsQuerySchema = z.object({
  global_treatment_id: z.coerce.number().int().positive().optional(),
  status: globalTreatmentFaqStatusSchema.optional(),
});

export const createGlobalTreatmentFaqSchema = z.object({
  global_treatment_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1, "Title is required").max(255),
  text: z.string().trim().min(1, "Text is required"),
  status: globalTreatmentFaqStatusSchema.optional(),
});

export const updateGlobalTreatmentFaqSchema = createGlobalTreatmentFaqSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

export type CreateGlobalTreatmentFaqInput = z.infer<typeof createGlobalTreatmentFaqSchema>;
export type UpdateGlobalTreatmentFaqInput = z.infer<typeof updateGlobalTreatmentFaqSchema>;
export type GlobalTreatmentFaqIdParam = z.infer<typeof globalTreatmentFaqIdParamSchema>;
export type ListGlobalTreatmentFaqsQuery = z.infer<typeof listGlobalTreatmentFaqsQuerySchema>;
