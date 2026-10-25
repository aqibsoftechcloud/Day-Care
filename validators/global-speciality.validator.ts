import { z } from "zod";

export const globalSpecialityStatusSchema = z.enum(["active", "inactive"]);

export const globalSpecialityIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listGlobalSpecialitiesQuerySchema = z.object({
  status: globalSpecialityStatusSchema.optional(),
});

// Deliberately has NO city_id/hospital_id/location_id/doctor_speciality_id
// — a global speciality is city-independent by design (see the approved
// architecture audit).
export const createGlobalSpecialitySchema = z.object({
  speciality_name: z.string().trim().min(1, "Speciality name is required").max(255),
  speciality_title: z.string().trim().max(255).nullable().optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255),
  short_description: z.string().trim().nullable().optional(),
  description: z.string().nullable().optional(),
  meta_title: z.string().trim().max(255).nullable().optional(),
  meta_description: z.string().trim().nullable().optional(),
  meta_keyword: z.string().trim().max(500).nullable().optional(),
  status: globalSpecialityStatusSchema.optional(),
});

export const updateGlobalSpecialitySchema = createGlobalSpecialitySchema.partial();

export type CreateGlobalSpecialityInput = z.infer<typeof createGlobalSpecialitySchema>;
export type UpdateGlobalSpecialityInput = z.infer<typeof updateGlobalSpecialitySchema>;
export type GlobalSpecialityIdParam = z.infer<typeof globalSpecialityIdParamSchema>;
export type ListGlobalSpecialitiesQuery = z.infer<typeof listGlobalSpecialitiesQuerySchema>;
