import { z } from "zod";

export const permissionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createPermissionSchema = z.object({
  module_id: z.coerce.number().int().positive(),
  action_id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1, "Name is required").max(150),
});

export const updatePermissionSchema = createPermissionSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type PermissionIdParam = z.infer<typeof permissionIdParamSchema>;
