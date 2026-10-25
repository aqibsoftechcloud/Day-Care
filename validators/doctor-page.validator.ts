import { z } from "zod";

export const doctorPageStatusSchema = z.enum(["active", "inactive"]);

export const doctorPageIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createDoctorPageSchema = z.object({
  pagename: z.string().trim().min(1, "Page name is required").max(255),
  keyword: z.string().trim().max(500).nullable().optional(),
  meta_title: z.string().trim().max(255).nullable().optional(),
  meta_description: z.string().trim().nullable().optional(),
  meta_keywords: z.string().trim().max(500).nullable().optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255),
  city_id: z.coerce.number().int().positive(),
  location_id: z.coerce.number().int().positive().nullable().optional(),
  speciality_id: z.coerce.number().int().positive(),
  // Not trimmed: CMS content stored exactly as submitted.
  description: z.string().nullable().optional(),
  status: doctorPageStatusSchema.optional(),
});

export const updateDoctorPageSchema = createDoctorPageSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateDoctorPageInput = z.infer<typeof createDoctorPageSchema>;
export type UpdateDoctorPageInput = z.infer<typeof updateDoctorPageSchema>;
export type DoctorPageIdParam = z.infer<typeof doctorPageIdParamSchema>;
