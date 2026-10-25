import { z } from "zod";

export const actionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createActionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(50)
    .regex(
      slugPattern,
      "Slug must be lowercase alphanumeric characters separated by hyphens"
    ),
});

export const updateActionSchema = createActionSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export type CreateActionInput = z.infer<typeof createActionSchema>;
export type UpdateActionInput = z.infer<typeof updateActionSchema>;
export type ActionIdParam = z.infer<typeof actionIdParamSchema>;
