import { z } from "zod";

/**
 * `global_treatment_sections` has no fixed/city-bound section kinds — a
 * global treatment has no hero/symptoms/doctors/hospital concept (those
 * are inherently city-specific) — so unlike `treatment_sections` there is
 * no polymorphic `section_type`/`content Json?`. Every row is one
 * ordered, titled, optionally-imaged rich-text block, same shape as
 * `treatment_sections`' own `custom` section content, just stored as
 * plain columns instead of a JSON blob (there being only one kind).
 */
export const globalTreatmentSectionStatusSchema = z.enum(["active", "inactive"]);

export const globalTreatmentIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const globalTreatmentSectionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  sectionId: z.coerce.number().int().positive(),
});

export const createGlobalTreatmentSectionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  // Not trimmed: rich-text HTML, stored exactly as submitted.
  content: z.string().nullable().optional(),
  // Local `/uploads/...` path only — set by the section-image upload
  // endpoint, never a free-text external URL (same convention as every
  // other section `image` field in this codebase).
  image: z.string().trim().max(500).nullable().optional(),
  status: globalTreatmentSectionStatusSchema.optional(),
});

export const updateGlobalTreatmentSectionSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(255).optional(),
    content: z.string().nullable().optional(),
    image: z.string().trim().max(500).nullable().optional(),
    section_order: z.coerce.number().int().min(0).optional(),
    status: globalTreatmentSectionStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

export const reorderGlobalTreatmentSectionsSchema = z.object({
  order: z
    .array(
      z.object({
        id: z.coerce.number().int().positive(),
        section_order: z.coerce.number().int().min(0),
      })
    )
    .min(1, "At least one section is required"),
});

export type CreateGlobalTreatmentSectionInput = z.infer<typeof createGlobalTreatmentSectionSchema>;
export type UpdateGlobalTreatmentSectionInput = z.infer<typeof updateGlobalTreatmentSectionSchema>;
export type ReorderGlobalTreatmentSectionsInput = z.infer<typeof reorderGlobalTreatmentSectionsSchema>;
