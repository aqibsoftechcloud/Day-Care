import { z } from "zod";

export const doctorSpecialityStatusSchema = z.enum(["active", "inactive"]);

export const doctorSpecialityIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listDoctorSpecialitiesQuerySchema = z.object({
  language_id: z.coerce.number().int().positive().optional(),
  status: doctorSpecialityStatusSchema.optional(),
});

export const createDoctorSpecialitySchema = z.object({
  language_id: z.coerce.number().int().positive(),
  speciality_name: z
    .string()
    .trim()
    .min(1, "Speciality name is required")
    .max(255),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255),
  status: doctorSpecialityStatusSchema.optional(),
});

export const updateDoctorSpecialitySchema = createDoctorSpecialitySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateDoctorSpecialityInput = z.infer<
  typeof createDoctorSpecialitySchema
>;
export type UpdateDoctorSpecialityInput = z.infer<
  typeof updateDoctorSpecialitySchema
>;
export type DoctorSpecialityIdParam = z.infer<
  typeof doctorSpecialityIdParamSchema
>;
export type ListDoctorSpecialitiesQuery = z.infer<
  typeof listDoctorSpecialitiesQuerySchema
>;
