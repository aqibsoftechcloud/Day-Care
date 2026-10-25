import { z } from "zod";

export const blogFaqStatusSchema = z.enum(["active", "inactive"]);

export const blogFaqIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listBlogFaqsQuerySchema = z.object({
  blog_id: z.coerce.number().int().positive().optional(),
});

export const createBlogFaqSchema = z.object({
  blog_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1, "Title is required").max(255),
  text: z.string().trim().min(1, "Text is required"),
  sorting_order: z.coerce.number().int().min(0).optional(),
  status: blogFaqStatusSchema.optional(),
});

export const updateBlogFaqSchema = createBlogFaqSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateBlogFaqInput = z.infer<typeof createBlogFaqSchema>;
export type UpdateBlogFaqInput = z.infer<typeof updateBlogFaqSchema>;
export type BlogFaqIdParam = z.infer<typeof blogFaqIdParamSchema>;
export type ListBlogFaqsQuery = z.infer<typeof listBlogFaqsQuerySchema>;
