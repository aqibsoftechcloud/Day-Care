import { z } from "zod";

export const roleStatusSchema = z.enum(["active", "inactive"]);

export const roleIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createRoleSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().max(255).nullable().optional(),
  status: roleStatusSchema.optional(),
});

export const updateRoleSchema = createRoleSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type RoleIdParam = z.infer<typeof roleIdParamSchema>;
