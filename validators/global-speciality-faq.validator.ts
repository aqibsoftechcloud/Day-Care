import { z } from "zod";

export const globalSpecialityFaqStatusSchema = z.enum(["active", "inactive"]);

export const globalSpecialityFaqIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listGlobalSpecialityFaqsQuerySchema = z.object({
  global_speciality_id: z.coerce.number().int().positive().optional(),
  status: globalSpecialityFaqStatusSchema.optional(),
});

export const createGlobalSpecialityFaqSchema = z.object({
  global_speciality_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1, "Title is required").max(255),
  text: z.string().trim().min(1, "Text is required"),
  status: globalSpecialityFaqStatusSchema.optional(),
});

export const updateGlobalSpecialityFaqSchema = createGlobalSpecialityFaqSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

export type CreateGlobalSpecialityFaqInput = z.infer<typeof createGlobalSpecialityFaqSchema>;
export type UpdateGlobalSpecialityFaqInput = z.infer<typeof updateGlobalSpecialityFaqSchema>;
export type GlobalSpecialityFaqIdParam = z.infer<typeof globalSpecialityFaqIdParamSchema>;
export type ListGlobalSpecialityFaqsQuery = z.infer<typeof listGlobalSpecialityFaqsQuerySchema>;
