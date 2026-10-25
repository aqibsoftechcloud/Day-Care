import { z } from "zod";

export const moduleStatusSchema = z.enum(["active", "inactive"]);

export const moduleIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createModuleSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(100)
    .regex(
      slugPattern,
      "Slug must be lowercase alphanumeric characters separated by hyphens"
    ),
  parent_id: z.coerce.number().int().positive().nullable().optional(),
  sorting_order: z.coerce.number().int().optional(),
  status: moduleStatusSchema.optional(),
});

export const updateModuleSchema = createModuleSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type ModuleIdParam = z.infer<typeof moduleIdParamSchema>;
