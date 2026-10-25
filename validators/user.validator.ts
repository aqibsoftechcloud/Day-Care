import { z } from "zod";

export const userStatusSchema = z.enum(["active", "inactive"]);

export const userIdParamSchema = z.object({
  id: z.string().trim().min(1, "Invalid user identifier"),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  role_id: z.coerce.number().int().positive(),
  status: userStatusSchema.optional(),
});

export const updateUserSchema = createUserSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
