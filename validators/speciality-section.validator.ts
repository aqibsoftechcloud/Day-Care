import { z } from "zod";
import { isSafeUrl } from "@/lib/rich-text";

/**
 * 10 section types total: 9 predefined/fixed types (exactly one row per
 * speciality each, enforced at the application layer — see
 * services/speciality-section.service.ts) plus "custom", which can have
 * any number of rows per speciality. Every row's real identity is its own
 * `id`, never `section_type` (mirrors `page_sections`' identical pattern).
 */
export const specialitySectionTypeSchema = z.enum([
  "hero",
  "overview",
  "treatments",
  "symptoms",
  "hospital",
  "faqs",
  "cta",
  "doctors",
  "custom",
  "why_choose_us",
]);
export const specialitySectionStatusSchema = z.enum(["active", "inactive"]);

export const specialityIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const specialitySectionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  sectionId: z.coerce.number().int().positive(),
});

/** Rejects `javascript:`/`data:`/`vbscript:` schemes — reuses the exact same guard the rich-text editor's own Link/Image insert flow already uses (lib/rich-text.ts), same as the Pages CTA section. */
const safeUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === "" || isSafeUrl(value), { message: "This URL isn't allowed" });

/**
 * Controlled allowlist — CMS content can only ever select one of these
 * keys, never an arbitrary string or a React component name. Shared by
 * both `why_choose_us` and `cta`'s `items` (defined once here, reused by
 * both content schemas below — never a second icon vocabulary). The
 * public renderers each map a key to one specific Lucide icon component;
 * any icon_key outside this list is rejected here at write time, and
 * defensively falls back to a safe generic icon at render time if it's
 * ever encountered anyway (e.g. old/edge-case data).
 */
export const whyChooseUsIconKeySchema = z.enum([
  "stethoscope",
  "building",
  "heart",
  "message",
  "shield",
  "doctor",
  "hospital",
  "check",
]);

export const whyChooseUsItemSchema = z.object({
  icon_key: whyChooseUsIconKeySchema,
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().min(1, "Description is required").max(1000),
});

/**
 * Every other fixed type reads straight from the existing `specialities`
 * columns/relations. All fields are optional: a blank field means "use
 * the default wording already shown on the public page today" (see
 * SpecialityFinalCta.tsx), so an admin who never touches this section
 * changes nothing. `items` (the "support points" bullets) reuses
 * `whyChooseUsItemSchema` verbatim — the exact same shape/icon allowlist
 * Why Choose Us already uses, not a second one — and is likewise
 * optional/unbounded-in-spirit (capped at 12 only as a sane UI limit):
 * an empty/missing array means the public page shows no support points
 * at all, never a fallback to old hardcoded copy.
 */
export const ctaSectionContentSchema = z.object({
  heading: z.string().trim().max(255).nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  items: z.array(whyChooseUsItemSchema).max(12).optional(),
  button_text: z.string().trim().max(100).nullable().optional(),
  button_url: safeUrlSchema.nullable().optional(),
});

/**
 * Custom content section — Title, rich-text Content, optional Image.
 * Mirrors validators/page-section.validator.ts's `aboutSectionContentSchema`
 * shape exactly (same field count/purpose), just named `title` instead of
 * `heading` per this feature's own spec. `content` is the RichTextEditor's
 * HTML output, rendered the same trusted way `pages.body`/page_sections'
 * `about`/`content` types already are (see lib/rich-text.ts).
 */
export const customSectionContentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  content: z.string().trim().min(1, "Content is required"),
  // Local `/uploads/...` path only — set by the section-image upload
  // endpoint, never a free-text external URL (see speciality-section.service.ts).
  image: z.string().trim().max(500).nullable().optional(),
});

/**
 * `heading` is optional — a blank value means "use the page's own
 * generic template heading" (see SpecialityWhyChooseUs.tsx's own
 * fallback), not "no heading". `items` supports any number of cards —
 * never artificially capped to 4 at the schema/DB level, even though the
 * current public layout visually reads best with around that many.
 * Reuses `whyChooseUsItemSchema` (declared above, before `cta`'s schema,
 * since `cta`'s `items` field needs it too).
 */
export const whyChooseUsSectionContentSchema = z.object({
  heading: z.string().trim().max(255).nullable().optional(),
  items: z.array(whyChooseUsItemSchema).max(12),
});

/** The only section type creatable through the API — a fixed type (hero/overview/etc.) can never be created this way, only auto-backfilled once each by getOrCreateSpecialitySections(). This is what structurally prevents duplicate fixed-section rows. */
export const createSpecialitySectionSchema = z.object({
  content: customSectionContentSchema,
  status: specialitySectionStatusSchema.optional(),
});

export const updateSpecialitySectionSchema = z
  .object({
    section_order: z.coerce.number().int().min(0).optional(),
    status: specialitySectionStatusSchema.optional(),
    // Only meaningful for "cta" and "custom" — re-validated against the
    // matching schema in services/speciality-section.service.ts, which is
    // the one place that knows the row's own section_type without a
    // second round trip.
    content: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

export const reorderSpecialitySectionsSchema = z.object({
  order: z
    .array(
      z.object({
        id: z.coerce.number().int().positive(),
        section_order: z.coerce.number().int().min(0),
      })
    )
    .min(1, "At least one section is required"),
});

export type SpecialitySectionType = z.infer<typeof specialitySectionTypeSchema>;
export type SpecialitySectionStatus = z.infer<typeof specialitySectionStatusSchema>;
export type CtaSectionContent = z.infer<typeof ctaSectionContentSchema>;
export type CustomSectionContent = z.infer<typeof customSectionContentSchema>;
export type WhyChooseUsIconKey = z.infer<typeof whyChooseUsIconKeySchema>;
export type WhyChooseUsItem = z.infer<typeof whyChooseUsItemSchema>;
export type WhyChooseUsSectionContent = z.infer<typeof whyChooseUsSectionContentSchema>;
export type CreateSpecialitySectionInput = z.infer<typeof createSpecialitySectionSchema>;
export type UpdateSpecialitySectionInput = z.infer<typeof updateSpecialitySectionSchema>;
export type ReorderSpecialitySectionsInput = z.infer<typeof reorderSpecialitySectionsSchema>;
