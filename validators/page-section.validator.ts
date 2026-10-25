import { z } from "zod";
import { isSafeUrl } from "@/lib/rich-text";

export const pageSectionTypeSchema = z.enum(["hero", "about", "features", "content", "cta", "hospital_listing"]);
export const pageSectionStatusSchema = z.enum(["active", "inactive"]);

export const pageSectionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  sectionId: z.coerce.number().int().positive(),
});

export const pageIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/** Rejects `javascript:`/`data:`/`vbscript:` schemes — reuses the exact same guard the rich-text editor's own Link/Image insert flow already uses (lib/rich-text.ts), rather than a second URL-safety check. */
const safeUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === "" || isSafeUrl(value), { message: "This URL isn't allowed" });

// --- Section-type content schemas -------------------------------------------

export const heroSectionContentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  subtitle: z.string().trim().max(500).nullable().optional(),
  // Local `/uploads/...` path only — set by the section-image upload
  // endpoint, never a free-text external URL (see page-section.service.ts).
  image: z.string().trim().max(500).nullable().optional(),
  cta_text: z.string().trim().max(100).nullable().optional(),
  cta_url: safeUrlSchema.nullable().optional(),
});

export const aboutSectionContentSchema = z.object({
  heading: z.string().trim().min(1, "Heading is required").max(255),
  // Rich HTML from the shared RichTextEditor — stored/rendered the same
  // way pages.body already is (see lib/rich-text.ts, GenericPageBody).
  content: z.string().trim().min(1, "Content is required"),
  image: z.string().trim().max(500).nullable().optional(),
});

export const featureItemSchema = z.object({
  title: z.string().trim().min(1, "Feature title is required").max(255),
  description: z.string().trim().max(1000).optional().default(""),
  image: z.string().trim().max(500).nullable().optional(),
});

export const featuresSectionContentSchema = z.object({
  heading: z.string().trim().min(1, "Heading is required").max(255),
  items: z.array(featureItemSchema).min(1, "At least one feature is required").max(12),
});

export const contentSectionContentSchema = z.object({
  heading: z.string().trim().min(1, "Heading is required").max(255),
  content: z.string().trim().min(1, "Content is required"),
});

export const ctaSectionContentSchema = z.object({
  heading: z.string().trim().min(1, "Heading is required").max(255),
  description: z.string().trim().max(1000).nullable().optional(),
  button_text: z.string().trim().min(1, "Button text is required").max(100),
  button_url: z
    .string()
    .trim()
    .min(1, "Button URL is required")
    .max(500)
    .refine((value) => isSafeUrl(value), { message: "This URL isn't allowed" }),
});

export const hospitalListingSectionContentSchema = z.object({
  heading: z.string().trim().min(1, "Heading is required").max(255),
  description: z.string().trim().max(1000).nullable().optional(),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  initial_count: z.number({ message: "Enter a number" }).int().min(1, "Show at least 1 hospital").max(48, "At most 48"),
  load_more: z.boolean(),
});

/** Keyed by `section_type` — the one place that maps a type to its content schema, reused by both `createPageSectionSchema` below and the service's update-time re-validation. */
export const SECTION_CONTENT_SCHEMAS = {
  hero: heroSectionContentSchema,
  about: aboutSectionContentSchema,
  features: featuresSectionContentSchema,
  content: contentSectionContentSchema,
  cta: ctaSectionContentSchema,
  hospital_listing: hospitalListingSectionContentSchema,
} as const;

const baseSectionFields = {
  section_order: z.coerce.number().int().min(0).optional(),
  status: pageSectionStatusSchema.optional(),
};

export const createPageSectionSchema = z.discriminatedUnion("section_type", [
  z.object({ section_type: z.literal("hero"), content: heroSectionContentSchema, ...baseSectionFields }),
  z.object({ section_type: z.literal("about"), content: aboutSectionContentSchema, ...baseSectionFields }),
  z.object({ section_type: z.literal("features"), content: featuresSectionContentSchema, ...baseSectionFields }),
  z.object({ section_type: z.literal("content"), content: contentSectionContentSchema, ...baseSectionFields }),
  z.object({ section_type: z.literal("cta"), content: ctaSectionContentSchema, ...baseSectionFields }),
  z.object({ section_type: z.literal("hospital_listing"), content: hospitalListingSectionContentSchema, ...baseSectionFields }),
]);

/**
 * `section_type` is immutable after creation (not accepted here) —
 * `content`, when provided, is re-validated in
 * services/page-section.service.ts against the section's own existing
 * type, since this generic schema has no way to know which per-type
 * shape applies without loading the row first.
 */
export const updatePageSectionSchema = z
  .object({
    section_order: z.coerce.number().int().min(0).optional(),
    status: pageSectionStatusSchema.optional(),
    content: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

export const reorderPageSectionsSchema = z.object({
  order: z
    .array(z.object({ id: z.coerce.number().int().positive(), section_order: z.coerce.number().int().min(0) }))
    .min(1, "At least one section is required"),
});

export type PageSectionType = z.infer<typeof pageSectionTypeSchema>;
export type PageSectionStatus = z.infer<typeof pageSectionStatusSchema>;
export type CreatePageSectionInput = z.infer<typeof createPageSectionSchema>;
export type UpdatePageSectionInput = z.infer<typeof updatePageSectionSchema>;
export type ReorderPageSectionsInput = z.infer<typeof reorderPageSectionsSchema>;
export type HeroSectionContent = z.infer<typeof heroSectionContentSchema>;
export type AboutSectionContent = z.infer<typeof aboutSectionContentSchema>;
export type FeaturesSectionContent = z.infer<typeof featuresSectionContentSchema>;
export type ContentSectionContent = z.infer<typeof contentSectionContentSchema>;
export type CtaSectionContent = z.infer<typeof ctaSectionContentSchema>;
