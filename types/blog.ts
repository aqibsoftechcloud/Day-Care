export type BlogStatus = "active" | "inactive";

/** `global` = not tied to a city (city_id null); `city` = tied to one city. */
export type BlogScope = "global" | "city";

/**
 * Mirrors services/blog.service.ts's toSafeBlog() output — embeds
 * `category`/`language`/`city` (renamed from the raw `blog_categories`/
 * `languages`/`cities` relations) alongside the raw FK scalars. Confirmed
 * by reading the service directly, not assumed from sibling modules.
 */
export type Blog = {
  id: number;
  blog_category_id: number;
  blog_title: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  seo_url: string;
  language_id: number;
  city_id: number | null;
  scope: BlogScope;
  blog_image: string | null;
  published_date: string | null;
  search_keywords_for_doctors: string | null;
  blog_status: BlogStatus;
  ai_content_generator: boolean;
  blog_text: string | null;
  author_name: string | null;
  author_image: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  category: { id: number; category_name: string; seo_url: string };
  language: { id: number; name: string; seo_url: string };
  /** `null` for a global blog. */
  city: { id: number; city_name: string; seo_url: string } | null;
  /** Related Reading associations — see blog_global_speciality_mappings' own doc comment. Never populated by category/city/keyword matching. */
  related_global_speciality_ids: number[];
  related_global_treatment_ids: number[];
};

/** Mirrors validators/blog.validator.ts's listBlogsQuerySchema. */
export type ListBlogsFilter = {
  blog_category_id?: number;
  language_id?: number;
  city_id?: number;
  scope?: BlogScope;
  blog_status?: BlogStatus;
  related_global_speciality_id?: number;
  related_global_treatment_id?: number;
};

/** Mirrors validators/blog.validator.ts's setBlogRelatedContentSchema — always a full replace of this blog's associations. */
export type SetBlogRelatedContentInput = {
  global_speciality_ids: number[];
  global_treatment_ids: number[];
};

/** Mirrors validators/blog.validator.ts's createBlogSchema — `blog_image` is handled separately as a File (multipart upload). */
export type CreateBlogInput = {
  blog_category_id: number;
  blog_title: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  seo_url: string;
  language_id: number;
  scope: BlogScope;
  /** Required when scope is `city`; must be omitted for `global`. */
  city_id?: number;
  published_date?: string | null;
  search_keywords_for_doctors?: string | null;
  blog_status?: BlogStatus;
  ai_content_generator?: boolean;
  blog_text?: string | null;
  author_name?: string | null;
  is_featured?: boolean;
};

export type UpdateBlogInput = Partial<CreateBlogInput>;
