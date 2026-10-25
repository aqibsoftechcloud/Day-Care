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
 * Independent from `speciality_sections`/its validator on purpose —
 * Treatment and Speciality stay fully separately managed (locked
 * architecture decision). Content SHAPES are reused directly where
 * identical (`cta`, `custom`, `why_choose_us`, and the shared icon
 * allowlist) — imported from the Speciality validator rather than
 * redefined, so there is never a second icon vocabulary or a second
 * "support points"/"custom section" shape to drift out of sync. Every
 * other schema below is genuinely Treatment-specific (Highlights, Facts,
 * Options, Eligibility, Process, Journey, Preparation/Recovery) —
 * structured content the locked public UI needs to render its specific
 * card/table/timeline layouts, which a generic `custom` rich-text section
 * cannot reproduce.
 *
 * 15 fixed types (exactly one row per treatment each, enforced at the
 * application layer — see services/treatment-section.service.ts) plus
 * "custom", which can have any number of rows per treatment.
 */
export const treatmentSectionTypeSchema = z.enum([
  "hero",
  "highlights",
  "overview",
  "facts",
  "symptoms",
  "options",
  "eligibility",
  "why_choose_us",
  "doctors",
  "process",
  "journey",
  "hospital",
  "preparation_recovery",
  "faqs",
  "cta",
  "custom",
]);
export const treatmentSectionStatusSchema = z.enum(["active", "inactive"]);

export const treatmentIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const treatmentSectionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  sectionId: z.coerce.number().int().positive(),
});

/** Shared by Highlights and Facts — both are plain label/value information strips/tables, just rendered in different places on the page and capped at different lengths. */
const labelValueItemSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(100),
  value: z.string().trim().min(1, "Value is required").max(255),
});

/** "Procedure Time | Hospital Stay | Recovery | …" strip under the Hero. Capped short — this renders as a compact single-row strip, not a table. */
export const highlightsSectionContentSchema = z.object({
  items: z.array(labelValueItemSchema).max(8),
});

/** The "Treatment Facts / At a Glance" table. */
export const factsSectionContentSchema = z.object({
  items: z.array(labelValueItemSchema).max(12),
});

const optionItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().min(1, "Description is required").max(500),
  points: z.array(z.string().trim().min(1).max(255)).max(8).optional(),
});

/** "Types of Treatment" — the UI renders however many items exist; never assumed to be exactly 3. */
export const optionsSectionContentSchema = z.object({
  heading: z.string().trim().max(255).nullable().optional(),
  items: z.array(optionItemSchema).max(6),
});

/**
 * "Who Is a Candidate" — optional per treatment. `indicators` has no
 * `.min()` (same "empty means hidden" convention every other
 * content-bearing type uses, e.g. `why_choose_us`'s `items`) — the
 * public component hides the whole section whenever `indicators` is
 * empty, so an admin clearing this section back out must be a valid
 * save, not a validation error. `intro` is likewise not required when
 * the section is otherwise empty.
 */
export const eligibilitySectionContentSchema = z.object({
  heading: z.string().trim().max(255).nullable().optional(),
  intro: z.string().trim().max(1000).nullable().optional(),
  indicators: z.array(z.string().trim().min(1).max(255)).max(10).optional(),
  note: z.string().trim().max(500).nullable().optional(),
});

const processItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().min(1, "Description is required").max(500),
});

/** "How {Treatment} Works" — the numbered editorial list, distinct from the Journey timeline below. */
export const processSectionContentSchema = z.object({
  heading: z.string().trim().max(255).nullable().optional(),
  items: z.array(processItemSchema).max(10),
});

const journeyStepSchema = z.object({
  duration: z.string().trim().min(1, "Duration/badge text is required").max(100),
  title: z.string().trim().min(1, "Title is required").max(255),
  icon: whyChooseUsIconKeySchema,
  points: z.array(z.string().trim().min(1).max(255)).max(8),
});

/**
 * The Patient Treatment Journey scroll-animated timeline. The frontend
 * renders however many steps exist — never hardcoded to 6 — and always
 * treats the LAST step as the distinct discharge/completed state. No
 * `.min()` on `steps` — same "empty means hidden" convention as every
 * other content-bearing type, so clearing this section back out is a
 * valid save.
 */
export const journeySectionContentSchema = z.object({
  heading: z.string().trim().max(255).nullable().optional(),
  steps: z.array(journeyStepSchema).max(12),
});

const preparationRecoveryGroupSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100),
  intro: z.string().trim().max(500).nullable().optional(),
  items: z.array(z.string().trim().min(1).max(255)).max(8),
});

/** "Preparation, Recovery & Aftercare" — the 3-column editorial block. */
export const preparationRecoverySectionContentSchema = z.object({
  groups: z.array(preparationRecoveryGroupSchema).max(6),
});

/** The only section type creatable through the API — a fixed type can never be created this way, only auto-backfilled once each by getOrCreateTreatmentSections(). This is what structurally prevents duplicate fixed-section rows. Reuses `customSectionContentSchema` from the Speciality validator verbatim (title/rich-text content/optional image) — same generic shape, same rendering convention, independent table/rows. */
export const createTreatmentSectionSchema = z.object({
  content: customSectionContentSchema,
  status: treatmentSectionStatusSchema.optional(),
});

export const updateTreatmentSectionSchema = z
  .object({
    section_order: z.coerce.number().int().min(0).optional(),
    status: treatmentSectionStatusSchema.optional(),
    // Re-validated against the matching per-type schema in
    // services/treatment-section.service.ts, which is the one place that
    // knows the row's own section_type without a second round trip.
    content: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

export const reorderTreatmentSectionsSchema = z.object({
  order: z
    .array(
      z.object({
        id: z.coerce.number().int().positive(),
        section_order: z.coerce.number().int().min(0),
      })
    )
    .min(1, "At least one section is required"),
});

// Re-exported so callers never need to import the Speciality validator
// directly just to get these shared shapes.
export { ctaSectionContentSchema, customSectionContentSchema, whyChooseUsIconKeySchema, whyChooseUsSectionContentSchema };

export type TreatmentSectionType = z.infer<typeof treatmentSectionTypeSchema>;
export type TreatmentSectionStatus = z.infer<typeof treatmentSectionStatusSchema>;
export type HighlightsSectionContent = z.infer<typeof highlightsSectionContentSchema>;
export type FactsSectionContent = z.infer<typeof factsSectionContentSchema>;
export type OptionsSectionContent = z.infer<typeof optionsSectionContentSchema>;
export type EligibilitySectionContent = z.infer<typeof eligibilitySectionContentSchema>;
export type ProcessSectionContent = z.infer<typeof processSectionContentSchema>;
export type JourneySectionContent = z.infer<typeof journeySectionContentSchema>;
export type PreparationRecoverySectionContent = z.infer<typeof preparationRecoverySectionContentSchema>;
export type CtaSectionContent = SharedCtaSectionContent;
export type CustomSectionContent = SharedCustomSectionContent;
export type WhyChooseUsSectionContent = SharedWhyChooseUsSectionContent;
export type CreateTreatmentSectionInput = z.infer<typeof createTreatmentSectionSchema>;
export type UpdateTreatmentSectionInput = z.infer<typeof updateTreatmentSectionSchema>;
export type ReorderTreatmentSectionsInput = z.infer<typeof reorderTreatmentSectionsSchema>;
