import { z } from "zod";

export const blogStatusSchema = z.enum(["active", "inactive"]);

/** `global` = not tied to a city (stored as city_id NULL); `city` = tied to one real city. */
export const blogScopeSchema = z.enum(["global", "city"]);

export const blogIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listBlogsQuerySchema = z.object({
  blog_category_id: z.coerce.number().int().positive().optional(),
  language_id: z.coerce.number().int().positive().optional(),
  city_id: z.coerce.number().int().positive().optional(),
  /** Narrow to global blogs or city-specific blogs. */
  scope: blogScopeSchema.optional(),
  blog_status: blogStatusSchema.optional(),
  // Related Reading filters — a blog matches only via an explicit row in
  // blog_global_speciality_mappings/blog_global_treatment_mappings, never
  // by category/city/keyword. See services/blog.service.ts's getBlogs().
  related_global_speciality_id: z.coerce.number().int().positive().optional(),
  related_global_treatment_id: z.coerce.number().int().positive().optional(),
});

/** The Blog form's Related Content save step — always a full replace of this blog's associations, same "resubmit the current full list" convention as blog_faqs, never a partial patch. */
export const setBlogRelatedContentSchema = z.object({
  global_speciality_ids: z.array(z.coerce.number().int().positive()).default([]),
  global_treatment_ids: z.array(z.coerce.number().int().positive()).default([]),
});

// multipart/form-data has no native null/date type — published_date arrives
// as a plain string, or is omitted entirely. A key that's absent from the
// input means "leave unchanged" on update (handled by the outer
// .optional() short-circuiting before this ever runs); an empty string
// explicitly clears it; anything else must parse as a valid date.
const publishedDateSchema = z
  .union([z.string(), z.date()])
  .nullable()
  .transform((value, ctx) => {
    if (value === null || value === "") {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "published_date must be a valid date",
      });
      return z.NEVER;
    }

    return date;
  });

// multipart/form-data has no native boolean type — values arrive as the
// strings "true"/"false". A plain z.coerce.boolean() would be a footgun
// here since JS `Boolean("false")` is `true`; this maps the string
// explicitly instead of relying on that coercion.
const booleanFromFormSchema = z.union([z.boolean(), z.string()]).transform(
  (value) => (typeof value === "boolean" ? value : value === "true" || value === "1")
);

// Non-file fields only — blog_image/author_image are uploaded images,
// validated separately in the upload layer using the actual file metadata
// Zod never sees here.
const blogBaseSchema = z.object({
  blog_category_id: z.coerce.number().int().positive(),
  blog_title: z.string().trim().min(1, "Blog title is required").max(255),
  meta_title: z.string().trim().max(255).nullable().optional(),
  meta_description: z.string().trim().nullable().optional(),
  meta_keywords: z.string().trim().max(500).nullable().optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255),
  language_id: z.coerce.number().int().positive(),
  scope: blogScopeSchema,
  // Required for a city blog, must be absent for a global one (see the scope check below). Multipart sends
  // nothing (or "") for a global blog's city.
  city_id: z.preprocess((value) => (value === "" || value === null ? undefined : value), z.coerce.number().int().positive().optional()),
  published_date: publishedDateSchema.optional(),
  search_keywords_for_doctors: z.string().trim().max(500).nullable().optional(),
  blog_status: blogStatusSchema.optional(),
  ai_content_generator: booleanFromFormSchema.optional(),
  // Not trimmed: LongText CMS content, stored exactly as submitted.
  blog_text: z.string().nullable().optional(),
  author_name: z.string().trim().max(255).nullable().optional(),
  is_featured: booleanFromFormSchema.optional(),
});

// No "at least one field" refinement here: a valid PUT may legitimately
// carry no text fields at all (e.g. only replacing/clearing the image).
// The controller enforces "at least one field OR an image change"
// instead, since only it sees the parsed text fields, the uploaded file,
// and the image-clear sentinel together.
type BlogScopeFields = { scope?: "global" | "city"; city_id?: number };

/** The scope contract. On create a city blog must name its city; on update the stored city is the fallback (the service enforces that one exists). */
function checkScope(data: BlogScopeFields, ctx: z.RefinementCtx, requireCityOnCity: boolean) {
  if (data.scope === "global" && data.city_id !== undefined) {
    ctx.addIssue({ code: "custom", path: ["city_id"], message: "A global blog cannot have a city" });
  }

  if (data.scope === "city" && requireCityOnCity && data.city_id === undefined) {
    ctx.addIssue({ code: "custom", path: ["city_id"], message: "City is required for a city-specific blog" });
  }
}

export const createBlogSchema = blogBaseSchema.superRefine((data, ctx) => checkScope(data, ctx, true));

export const updateBlogSchema = blogBaseSchema.partial().superRefine((data, ctx) => checkScope(data, ctx, false));

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
export type BlogScope = z.infer<typeof blogScopeSchema>;
export type BlogIdParam = z.infer<typeof blogIdParamSchema>;
export type ListBlogsQuery = z.infer<typeof listBlogsQuerySchema>;
export type SetBlogRelatedContentInput = z.infer<typeof setBlogRelatedContentSchema>;
