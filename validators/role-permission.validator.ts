import { z } from "zod";

export const rolePermissionsParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const syncRolePermissionsSchema = z.object({
  permission_ids: z
    .array(z.coerce.number().int().positive())
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "permission_ids must not contain duplicates",
    }),
});

export type SyncRolePermissionsInput = z.infer<
  typeof syncRolePermissionsSchema
>;
