import { z } from "zod";

export const hospitalFaqStatusSchema = z.enum(["active", "inactive"]);

export const hospitalFaqIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listHospitalFaqsQuerySchema = z.object({
  hospital_id: z.coerce.number().int().positive().optional(),
});

export const createHospitalFaqSchema = z.object({
  hospital_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1, "Title is required").max(255),
  text: z.string().trim().min(1, "Text is required"),
  status: hospitalFaqStatusSchema.optional(),
});

export const updateHospitalFaqSchema = createHospitalFaqSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateHospitalFaqInput = z.infer<typeof createHospitalFaqSchema>;
export type UpdateHospitalFaqInput = z.infer<typeof updateHospitalFaqSchema>;
export type HospitalFaqIdParam = z.infer<typeof hospitalFaqIdParamSchema>;
export type ListHospitalFaqsQuery = z.infer<
  typeof listHospitalFaqsQuerySchema
>;
