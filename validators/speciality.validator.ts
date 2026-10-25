import { z } from "zod";

export const specialityStatusSchema = z.enum(["active", "inactive"]);

export const specialityIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listSpecialitiesQuerySchema = z.object({
  city_id: z.coerce.number().int().positive().optional(),
  location_id: z.coerce.number().int().positive().optional(),
  hospital_id: z.coerce.number().int().positive().optional(),
  parent_speciality_id: z.coerce.number().int().positive().optional(),
  // Also reused by the public `/dcg/{seoUrl}` resolver's "Choose Your City"
  // section — same filter, no duplicate query logic.
  global_speciality_id: z.coerce.number().int().positive().optional(),
  status: specialityStatusSchema.optional(),
});

// multipart/form-data has no native null — an explicit empty string clears
// this nullable relation (matches the admin form's "None" dropdown option);
// omitting the field entirely leaves the existing value unchanged on update.
// Without this, switching Speciality Logo to a multipart upload would have
// silently broken the existing ability to clear City/Location/Hospital/
// Parent Speciality back to "None".
const nullableIdFromFormSchema = z
  .union([z.coerce.number().int().positive(), z.literal("")])
  .nullable()
  .optional()
  .transform((value) => (value === "" ? null : value));

export const createSpecialitySchema = z.object({
  speciality_name: z
    .string()
    .trim()
    .min(1, "Speciality name is required")
    .max(255),
  speciality_title: z.string().trim().max(255).nullable().optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255),
  meta_title: z.string().trim().max(255).nullable().optional(),
  meta_description: z.string().trim().nullable().optional(),
  meta_keyword: z.string().trim().max(500).nullable().optional(),
  city_id: z.coerce.number().int().positive(),
  location_id: nullableIdFromFormSchema,
  hospital_id: nullableIdFromFormSchema,
  // speciality_logo is deliberately excluded here — it's an uploaded
  // image now, validated separately in services/speciality.service.ts
  // against the actual file metadata, which Zod never sees.
  short_description: z.string().trim().nullable().optional(),
  parent_speciality_id: nullableIdFromFormSchema,
  // Links this clinical speciality to a nationwide doctor_specialities
  // taxonomy row (never doctors.id directly) — the public Speciality
  // Doctors section's only source for "which doctors work in this
  // speciality" (via doctor_speciality_mappings). Nullable: a speciality
  // is fully valid with no Doctors section configured.
  doctor_speciality_id: nullableIdFromFormSchema,
  // Optional link to this speciality's city-independent "global" concept
  // (`global_specialities` — see that model's own doc comment). Nullable:
  // most city specialities start, and may stay, unlinked. Never
  // auto-matched/auto-selected — an explicit admin choice only.
  global_speciality_id: nullableIdFromFormSchema,
  keywords_for_doctors: z.string().trim().max(500).nullable().optional(),
  status: specialityStatusSchema.optional(),
  // multipart/form-data has no native boolean type — values arrive as the
  // strings "true"/"false". A plain z.coerce.boolean() would be a footgun
  // here since JS `Boolean("false")` is `true`; this maps the string
  // explicitly instead of relying on that coercion (mirrors
  // validators/doctor.validator.ts's identical helper).
  ai_content_generator: z
    .union([z.boolean(), z.string()])
    .transform((value) => (typeof value === "boolean" ? value : value === "true" || value === "1"))
    .optional(),
  // Not trimmed: LongText CMS content, stored exactly as submitted.
  description: z.string().nullable().optional(),
});

// No "at least one field" refinement here: a valid PUT may legitimately
// carry no text fields at all (e.g. only replacing/clearing the logo).
// The controller enforces "at least one field OR an image change" instead,
// since only it sees the parsed text fields, the uploaded file, and the
// image-clear sentinel together (mirrors validators/doctor.validator.ts).
export const updateSpecialitySchema = createSpecialitySchema.partial();

export type CreateSpecialityInput = z.infer<typeof createSpecialitySchema>;
export type UpdateSpecialityInput = z.infer<typeof updateSpecialitySchema>;
export type SpecialityIdParam = z.infer<typeof specialityIdParamSchema>;
export type ListSpecialitiesQuery = z.infer<
  typeof listSpecialitiesQuerySchema
>;
