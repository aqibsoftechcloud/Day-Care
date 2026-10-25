import { z } from "zod";
import {
  ctaSectionContentSchema,
  customSectionContentSchema,
  whyChooseUsIconKeySchema,
  whyChooseUsSectionContentSchema,
} from "@/validators/speciality-section.validator";
import type {
  CtaSectionContent as SharedCtaSectionContent,
  CustomSectionContent as SharedCustomSectionContent,
  WhyChooseUsSectionContent as SharedWhyChooseUsSectionContent,
} from "@/validators/speciality-section.validator";

/**
 * Independent from `speciality_sections`/`treatment_sections` on purpose
 * — same locked "each entity stays separately managed" decision. Content
 * SHAPES are reused directly where identical (`cta`, `custom`,
 * `why_choose_us`, and the shared icon allowlist) — imported from the
 * Speciality validator rather than redefined, same convention
 * `treatment-section.validator.ts` already established.
 *
 * Deliberately a SMALLER fixed-type set than Treatment/Speciality: the
 * locked Hospital Detail UI has no Highlights/Symptoms/Options/Process/
 * etc. sections to back. `hero`/`overview`/`disclaimer` have no
 * configurable content at all (see hospital_sections' own schema.prisma
 * doc comment) — only `why_choose_us` and `cta` carry real structured
 * content, plus the open-ended `custom`.
 */
export const hospitalSectionTypeSchema = z.enum(["hero", "overview", "why_choose_us", "cta", "disclaimer", "custom"]);
export const hospitalSectionStatusSchema = z.enum(["active", "inactive"]);

/**
 * Hospital-only extension of the shared `ctaSectionContentSchema` — adds an
 * optional right-side visual for the Final CTA section. NOT added to the
 * shared schema itself: Treatment/Speciality's own Final CTA has no such
 * image slot, and this task is explicitly scoped to Hospital only. Same
 * "local `/uploads/...` path only, set by the section-image upload
 * endpoint, never a free-text external URL" convention as
 * `customSectionContentSchema.image` (see `uploadHospitalSectionImage`).
 */
export const hospitalCtaSectionContentSchema = ctaSectionContentSchema.extend({
  image: z.string().trim().max(500).nullable().optional(),
});

export const hospitalIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const hospitalSectionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  sectionId: z.coerce.number().int().positive(),
});

/** The only section type creatable through the API — a fixed type can never be created this way, only auto-backfilled once each by getOrCreateHospitalSections(). Reuses `customSectionContentSchema` verbatim (title/rich-text content/optional image). */
export const createHospitalSectionSchema = z.object({
  content: customSectionContentSchema,
  status: hospitalSectionStatusSchema.optional(),
});

export const updateHospitalSectionSchema = z
  .object({
    section_order: z.coerce.number().int().min(0).optional(),
    status: hospitalSectionStatusSchema.optional(),
    // Re-validated against the matching per-type schema in
    // services/hospital-section.service.ts, which is the one place that
    // knows the row's own section_type without a second round trip.
    content: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

export const reorderHospitalSectionsSchema = z.object({
  order: z
    .array(
      z.object({
        id: z.coerce.number().int().positive(),
        section_order: z.coerce.number().int().min(0),
      })
    )
    .min(1, "At least one section is required"),
});

// Re-exported so callers never need to import the Speciality validator directly just to get these shared shapes.
export { ctaSectionContentSchema, customSectionContentSchema, whyChooseUsIconKeySchema, whyChooseUsSectionContentSchema };

export type HospitalSectionType = z.infer<typeof hospitalSectionTypeSchema>;
export type HospitalSectionStatus = z.infer<typeof hospitalSectionStatusSchema>;
export type CtaSectionContent = SharedCtaSectionContent & { image?: string | null };
export type CustomSectionContent = SharedCustomSectionContent;
export type WhyChooseUsSectionContent = SharedWhyChooseUsSectionContent;
export type CreateHospitalSectionInput = z.infer<typeof createHospitalSectionSchema>;
export type UpdateHospitalSectionInput = z.infer<typeof updateHospitalSectionSchema>;
export type ReorderHospitalSectionsInput = z.infer<typeof reorderHospitalSectionsSchema>;
