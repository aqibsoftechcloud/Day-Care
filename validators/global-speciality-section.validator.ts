import { z } from "zod";

/** Same flat, single-kind structure as `global-treatment-section.validator.ts` — see that file's doc comment. */
export const globalSpecialitySectionStatusSchema = z.enum(["active", "inactive"]);

export const globalSpecialityIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const globalSpecialitySectionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  sectionId: z.coerce.number().int().positive(),
});

export const createGlobalSpecialitySectionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  content: z.string().nullable().optional(),
  image: z.string().trim().max(500).nullable().optional(),
  status: globalSpecialitySectionStatusSchema.optional(),
});

export const updateGlobalSpecialitySectionSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(255).optional(),
    content: z.string().nullable().optional(),
    image: z.string().trim().max(500).nullable().optional(),
    section_order: z.coerce.number().int().min(0).optional(),
    status: globalSpecialitySectionStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

export const reorderGlobalSpecialitySectionsSchema = z.object({
  order: z
    .array(
      z.object({
        id: z.coerce.number().int().positive(),
        section_order: z.coerce.number().int().min(0),
      })
    )
    .min(1, "At least one section is required"),
});

export type CreateGlobalSpecialitySectionInput = z.infer<typeof createGlobalSpecialitySectionSchema>;
export type UpdateGlobalSpecialitySectionInput = z.infer<typeof updateGlobalSpecialitySectionSchema>;
export type ReorderGlobalSpecialitySectionsInput = z.infer<typeof reorderGlobalSpecialitySectionsSchema>;
