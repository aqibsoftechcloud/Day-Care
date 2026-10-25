import { z } from "zod";

export const specialityFaqStatusSchema = z.enum(["active", "inactive"]);

export const specialityFaqIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listSpecialityFaqsQuerySchema = z.object({
  speciality_id: z.coerce.number().int().positive().optional(),
});

export const createSpecialityFaqSchema = z.object({
  speciality_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1, "Title is required").max(255),
  text: z.string().trim().min(1, "Text is required"),
  status: specialityFaqStatusSchema.optional(),
});

export const updateSpecialityFaqSchema = createSpecialityFaqSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateSpecialityFaqInput = z.infer<
  typeof createSpecialityFaqSchema
>;
export type UpdateSpecialityFaqInput = z.infer<
  typeof updateSpecialityFaqSchema
>;
export type SpecialityFaqIdParam = z.infer<typeof specialityFaqIdParamSchema>;
export type ListSpecialityFaqsQuery = z.infer<
  typeof listSpecialityFaqsQuerySchema
>;
