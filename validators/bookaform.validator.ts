import { z } from "zod";

export const bookaformDataStatusSchema = z.enum(["active", "inactive"]);

export const bookaformDataIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listBookaformDataQuerySchema = z.object({
  status: bookaformDataStatusSchema.optional(),
});

// Mirrors bookaform_data's actual columns exactly — no field invented.
export const updateBookaformDataSchema = z.object({
  data_from: z.string().trim().min(1, "This field is required").max(255, "Value is too long"),
  status: bookaformDataStatusSchema,
});

export type BookaformDataIdParam = z.infer<typeof bookaformDataIdParamSchema>;
export type ListBookaformDataQuery = z.infer<
  typeof listBookaformDataQuerySchema
>;
export type UpdateBookaformDataInput = z.infer<
  typeof updateBookaformDataSchema
>;
