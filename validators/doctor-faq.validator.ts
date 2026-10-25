import { z } from "zod";

export const doctorFaqStatusSchema = z.enum(["active", "inactive"]);

export const doctorFaqIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listDoctorFaqsQuerySchema = z.object({
  doctor_id: z.coerce.number().int().positive().optional(),
});

export const createDoctorFaqSchema = z.object({
  doctor_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1, "Title is required").max(255),
  text: z.string().trim().min(1, "Text is required"),
  status: doctorFaqStatusSchema.optional(),
});

export const updateDoctorFaqSchema = createDoctorFaqSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateDoctorFaqInput = z.infer<typeof createDoctorFaqSchema>;
export type UpdateDoctorFaqInput = z.infer<typeof updateDoctorFaqSchema>;
export type DoctorFaqIdParam = z.infer<typeof doctorFaqIdParamSchema>;
export type ListDoctorFaqsQuery = z.infer<typeof listDoctorFaqsQuerySchema>;
