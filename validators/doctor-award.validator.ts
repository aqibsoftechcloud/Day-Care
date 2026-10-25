import { z } from "zod";

export const doctorAwardStatusSchema = z.enum(["active", "inactive"]);

export const doctorAwardIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listDoctorAwardsQuerySchema = z.object({
  doctor_id: z.coerce.number().int().positive().optional(),
});

export const createDoctorAwardSchema = z.object({
  doctor_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1, "Title is required").max(255),
  organization: z.string().trim().max(255).nullable().optional(),
  award_year: z.string().trim().max(50).nullable().optional(),
  description: z.string().trim().nullable().optional(),
  status: doctorAwardStatusSchema.optional(),
});

export const updateDoctorAwardSchema = createDoctorAwardSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateDoctorAwardInput = z.infer<typeof createDoctorAwardSchema>;
export type UpdateDoctorAwardInput = z.infer<typeof updateDoctorAwardSchema>;
export type DoctorAwardIdParam = z.infer<typeof doctorAwardIdParamSchema>;
export type ListDoctorAwardsQuery = z.infer<typeof listDoctorAwardsQuerySchema>;
