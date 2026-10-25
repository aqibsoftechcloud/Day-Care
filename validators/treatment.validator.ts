import { z } from "zod";

export const treatmentStatusSchema = z.enum(["active", "inactive"]);

export const treatmentIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listTreatmentsQuerySchema = z.object({
  speciality_id: z.coerce.number().int().positive().optional(),
  language_id: z.coerce.number().int().positive().optional(),
  city_id: z.coerce.number().int().positive().optional(),
  location_id: z.coerce.number().int().positive().optional(),
  hospital_id: z.coerce.number().int().positive().optional(),
  // Also reused by the public `/dcg/{seoUrl}` resolver's "Choose Your City"
  // section — same filter, no duplicate query logic.
  global_treatment_id: z.coerce.number().int().positive().optional(),
  status: treatmentStatusSchema.optional(),
});

// multipart/form-data has no native boolean type — values arrive as the
// strings "true"/"false". A plain z.coerce.boolean() would be a footgun
// here since JS `Boolean("false")` is `true`; this maps the string
// explicitly instead of relying on that coercion.
const booleanFromFormSchema = z.union([z.boolean(), z.string()]).transform(
  (value) => (typeof value === "boolean" ? value : value === "true" || value === "1")
);

// Non-file fields only — speciality_logo is an uploaded image, validated
// separately in the upload layer using the actual file metadata Zod
// never sees here.
export const createTreatmentSchema = z.object({
  speciality_id: z.coerce.number().int().positive(),
  sub_speciality_name: z
    .string()
    .trim()
    .min(1, "Sub-speciality name is required")
    .max(255),
  sub_speciality_title: z.string().trim().max(255).nullable().optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255),
  meta_title: z.string().trim().max(255).nullable().optional(),
  meta_description: z.string().trim().nullable().optional(),
  meta_keyword: z.string().trim().max(500).nullable().optional(),
  language_id: z.coerce.number().int().positive(),
  city_id: z.coerce.number().int().positive(),
  location_id: z.coerce.number().int().positive().nullable().optional(),
  hospital_id: z.coerce.number().int().positive().nullable().optional(),
  short_description: z.string().trim().nullable().optional(),
  // Optional link to this treatment's city-independent "global" concept
  // (`global_treatments` — see that model's own doc comment). Nullable:
  // most city treatments start, and may stay, unlinked. Never
  // auto-matched/auto-selected — an explicit admin choice only.
  global_treatment_id: z
    .union([z.coerce.number().int().positive(), z.literal("")])
    .nullable()
    .optional()
    .transform((value) => (value === "" ? null : value)),
  keywords_for_doctors: z.string().trim().max(500).nullable().optional(),
  status: treatmentStatusSchema.optional(),
  ai_content_generator: booleanFromFormSchema.optional(),
  // Not trimmed: LongText CMS content, stored exactly as submitted.
  description: z.string().nullable().optional(),
});

// No "at least one field" refinement here: a valid PUT may legitimately
// carry no text fields at all (e.g. replacing only speciality_logo). The
// controller enforces "at least one field OR a new image" instead, since
// only it sees both the parsed text fields and the uploaded file together.
export const updateTreatmentSchema = createTreatmentSchema.partial();

export type CreateTreatmentInput = z.infer<typeof createTreatmentSchema>;
export type UpdateTreatmentInput = z.infer<typeof updateTreatmentSchema>;
export type TreatmentIdParam = z.infer<typeof treatmentIdParamSchema>;
export type ListTreatmentsQuery = z.infer<typeof listTreatmentsQuerySchema>;
