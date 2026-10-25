export type BlogCategoryStatus = "active" | "inactive";

/** Mirrors services/blog-category.service.ts's toSafeBlogCategory() output. */
export type BlogCategory = {
  id: number;
  category_name: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  seo_url: string;
  status: BlogCategoryStatus;
  created_at: string;
  updated_at: string;
  /** Default Related Reading associations for every blog in this category — only used as a fallback when a blog has no explicit association of its own for that type. See blog_category_global_speciality_mappings' own doc comment. */
  related_global_speciality_ids: number[];
  related_global_treatment_ids: number[];
};

/** Mirrors validators/blog-category.validator.ts's listBlogCategoriesQuerySchema. */
export type ListBlogCategoriesFilter = {
  status?: BlogCategoryStatus;
};

/** Mirrors validators/blog-category.validator.ts's createBlogCategorySchema. */
export type CreateBlogCategoryInput = {
  category_name: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  seo_url: string;
  status?: BlogCategoryStatus;
  global_speciality_ids?: number[];
  global_treatment_ids?: number[];
};

export type UpdateBlogCategoryInput = Partial<CreateBlogCategoryInput>;
