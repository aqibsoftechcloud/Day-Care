import { z } from "zod";

export const blogCategoryStatusSchema = z.enum(["active", "inactive"]);

export const blogCategoryIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listBlogCategoriesQuerySchema = z.object({
  status: blogCategoryStatusSchema.optional(),
});

export const createBlogCategorySchema = z.object({
  category_name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(255),
  meta_title: z.string().trim().max(255).nullable().optional(),
  meta_description: z.string().trim().nullable().optional(),
  meta_keywords: z.string().trim().max(500).nullable().optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255),
  status: blogCategoryStatusSchema.optional(),
  // Default Related Reading associations for every blog in this category
  // — only used as a fallback when a blog has no explicit association of
  // its own for that same type (speciality/treatment independently). On
  // update, omitting the field entirely leaves existing mappings
  // unchanged; an explicit (possibly empty) array always replaces the
  // full set.
  global_speciality_ids: z.array(z.coerce.number().int().positive()).optional(),
  global_treatment_ids: z.array(z.coerce.number().int().positive()).optional(),
});

export const updateBlogCategorySchema = createBlogCategorySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateBlogCategoryInput = z.infer<typeof createBlogCategorySchema>;
export type UpdateBlogCategoryInput = z.infer<typeof updateBlogCategorySchema>;
export type BlogCategoryIdParam = z.infer<typeof blogCategoryIdParamSchema>;
export type ListBlogCategoriesQuery = z.infer<
  typeof listBlogCategoriesQuerySchema
>;
