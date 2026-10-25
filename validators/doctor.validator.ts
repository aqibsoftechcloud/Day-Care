import { z } from "zod";

export const doctorStatusSchema = z.enum(["active", "inactive"]);

export const doctorIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listDoctorsQuerySchema = z.object({
  language_id: z.coerce.number().int().positive().optional(),
  city_id: z.coerce.number().int().positive().optional(),
  location_id: z.coerce.number().int().positive().optional(),
  status: doctorStatusSchema.optional(),
});

// Accepts a plain number or a numeric string; passed through to Prisma
// as-is (no rounding/truncation) and let the DB's own DECIMAL(p,s)
// column enforce precision/scale.
const decimalInputSchema = z.union([
  z.number(),
  z.string().regex(/^-?\d+(\.\d+)?$/, "Must be a valid decimal number"),
]);

// multipart/form-data has no native boolean type — values arrive as the
// strings "true"/"false". A plain z.coerce.boolean() would be a footgun
// here since JS `Boolean("false")` is `true`; this maps the string
// explicitly instead of relying on that coercion.
const booleanFromFormSchema = z.union([z.boolean(), z.string()]).transform(
  (value) => (typeof value === "boolean" ? value : value === "true" || value === "1")
);

// multipart/form-data has no native JSON type — schema_tags arrives as a
// JSON-encoded string, or is omitted entirely. An empty string explicitly
// clears it; anything else must parse as valid JSON. The structure itself
// is intentionally left opaque/untouched, per project convention.
const schemaTagsSchema = z.string().nullable().transform((value, ctx) => {
  if (value === null || value === "") {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "schema_tags must be valid JSON",
    });
    return z.NEVER;
  }
});

// Non-file fields only — doctor_image is an uploaded image, validated
// separately in the upload layer using the actual file metadata Zod
// never sees here.
export const createDoctorSchema = z.object({
  language_id: z.coerce.number().int().positive(),
  doctor_name: z.string().trim().min(1, "Doctor name is required").max(255),
  meta_title: z.string().trim().max(255).nullable().optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255),
  meta_description: z.string().trim().nullable().optional(),
  meta_keywords: z.string().trim().max(500).nullable().optional(),
  qualification: z.string().trim().max(500).nullable().optional(),
  experience: z.string().trim().max(255).nullable().optional(),
  availability: z.string().trim().max(255).nullable().optional(),
  city_id: z.coerce.number().int().positive(),
  location_id: z.coerce.number().int().positive().nullable().optional(),
  patient_satisfaction_score: decimalInputSchema.nullable().optional(),
  sorting_order: z.coerce.number().int().optional(),
  mon_sat_first_timings: z.string().trim().max(255).nullable().optional(),
  mon_sat_second_timings: z.string().trim().max(255).nullable().optional(),
  sunday_timings: z.string().trim().max(255).nullable().optional(),
  time_interval: z.string().trim().max(100).nullable().optional(),
  location_map: z.string().trim().nullable().optional(),
  doctor_description: z.string().trim().nullable().optional(),
  ai_content_generator: booleanFromFormSchema.optional(),
  // Not trimmed: LongText CMS content, stored exactly as submitted.
  doc_info: z.string().nullable().optional(),
  schema_tags: schemaTagsSchema.optional(),
  latitude: decimalInputSchema.nullable().optional(),
  longitude: decimalInputSchema.nullable().optional(),
  status: doctorStatusSchema.optional(),
});

// No "at least one field" refinement here: a valid PUT may legitimately
// carry no text fields at all (e.g. only replacing/clearing the image).
// The controller enforces "at least one field OR an image change"
// instead, since only it sees the parsed text fields, the uploaded file,
// and the image-clear sentinel together.
export const updateDoctorSchema = createDoctorSchema.partial();

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
export type DoctorIdParam = z.infer<typeof doctorIdParamSchema>;
export type ListDoctorsQuery = z.infer<typeof listDoctorsQuerySchema>;
