import { z } from "zod";

export const hospitalStatusSchema = z.enum(["active", "inactive"]);

export const hospitalIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listHospitalsQuerySchema = z.object({
  city_id: z.coerce.number().int().positive().optional(),
  status: hospitalStatusSchema.optional(),
});

// Accepts a plain number or a numeric string; passed through to Prisma
// as-is (no rounding/truncation) and let the DB's own DECIMAL(p,s)
// column enforce precision/scale.
const decimalInputSchema = z.union([
  z.number(),
  z.string().regex(/^-?\d+(\.\d+)?$/, "Must be a valid decimal number"),
]);

export const createHospitalSchema = z.object({
  hospital_name: z
    .string()
    .trim()
    .min(1, "Hospital name is required")
    .max(255),
  city_id: z.coerce.number().int().positive(),
  location_id: z.coerce.number().int().positive().nullable().optional(),
  meta_title: z.string().trim().max(255).nullable().optional(),
  meta_description: z.string().trim().nullable().optional(),
  meta_keywords: z.string().trim().max(500).nullable().optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255),
  phone_number: z.string().trim().max(50).nullable().optional(),
  timings: z.string().trim().max(255).nullable().optional(),
  address: z.string().trim().nullable().optional(),
  hospital_image: z.string().trim().max(500).nullable().optional(),
  google_reviews: decimalInputSchema.nullable().optional(),
  patient_satisfaction_score: decimalInputSchema.nullable().optional(),
  location_360_view: z.string().trim().max(1000).nullable().optional(),
  location_map: z.string().trim().nullable().optional(),
  hospital_description: z.string().trim().nullable().optional(),
  // Not trimmed: LongText CMS content, stored exactly as submitted.
  long_description: z.string().nullable().optional(),
  // Any JSON-compatible value; already guaranteed JSON-safe by
  // request.json() having parsed it in the first place.
  hospital_gallery: z.unknown().nullable().optional(),
  status: hospitalStatusSchema.optional(),
});

export const updateHospitalSchema = createHospitalSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateHospitalInput = z.infer<typeof createHospitalSchema>;
export type UpdateHospitalInput = z.infer<typeof updateHospitalSchema>;
export type HospitalIdParam = z.infer<typeof hospitalIdParamSchema>;
export type ListHospitalsQuery = z.infer<typeof listHospitalsQuerySchema>;
