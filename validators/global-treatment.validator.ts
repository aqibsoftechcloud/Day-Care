import { z } from "zod";

export const globalTreatmentStatusSchema = z.enum(["active", "inactive"]);

export const globalTreatmentIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listGlobalTreatmentsQuerySchema = z.object({
  status: globalTreatmentStatusSchema.optional(),
  global_speciality_id: z.coerce.number().int().positive().optional(),
});

// Non-file fields only — `image` is an uploaded image, validated
// separately in the upload layer using the actual file metadata Zod
// never sees here. Deliberately has NO city_id/hospital_id/location_id/
// speciality_id — a global treatment is city-independent by design (see
// the approved architecture audit).
export const createGlobalTreatmentSchema = z.object({
  treatment_name: z.string().trim().min(1, "Treatment name is required").max(255),
  treatment_title: z.string().trim().max(255).nullable().optional(),
  // Free text in the CMS form, so a stray space or a pasted speciality label
  // (e.g. "ear-surgery -ENT") would otherwise be stored verbatim and break
  // the public URL — lowercase letters, digits and single hyphens only.
  seo_url: z
    .string()
    .trim()
    .min(1, "SEO URL is required")
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "SEO URL may only contain lowercase letters, numbers and single hyphens (no spaces)"),
  short_description: z.string().trim().nullable().optional(),
  // Not trimmed: LongText CMS content, stored exactly as submitted.
  description: z.string().nullable().optional(),
  meta_title: z.string().trim().max(255).nullable().optional(),
  meta_description: z.string().trim().nullable().optional(),
  meta_keyword: z.string().trim().max(500).nullable().optional(),
  // Optional link to a `global_specialities` row — nullable, admin-set
  // only, never auto-matched (see the schema's own doc comment on this
  // column). Multipart form fields are always strings and have no native
  // null, so an explicit clear is sent as `""` (the same sentinel
  // `resolveImageInput` already uses for clearing the image) — preprocess
  // maps that to real `null` before `.nullable()` short-circuits on it;
  // the field being entirely absent (`undefined`) still means "leave
  // unchanged", same as every other optional field here.
  global_speciality_id: z.preprocess(
    (value) => (value === "" ? null : value),
    z.coerce.number().int().positive().nullable().optional()
  ),
  status: globalTreatmentStatusSchema.optional(),
});

// No "at least one field" refinement — a valid PUT may legitimately carry
// no text fields at all (e.g. replacing only the image). The controller
// enforces "at least one field OR a new image" instead, same convention
// `updateTreatmentSchema` already uses.
export const updateGlobalTreatmentSchema = createGlobalTreatmentSchema.partial();

export type CreateGlobalTreatmentInput = z.infer<typeof createGlobalTreatmentSchema>;
export type UpdateGlobalTreatmentInput = z.infer<typeof updateGlobalTreatmentSchema>;
export type GlobalTreatmentIdParam = z.infer<typeof globalTreatmentIdParamSchema>;
export type ListGlobalTreatmentsQuery = z.infer<typeof listGlobalTreatmentsQuerySchema>;
