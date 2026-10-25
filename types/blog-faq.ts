export type BlogFaqStatus = "active" | "inactive";

/** Mirrors services/blog-faq.service.ts's toSafeBlogFaq() output — embeds `blog` (renamed from the raw `blogs` relation). */
export type BlogFaq = {
  id: number;
  blog_id: number;
  title: string;
  text: string;
  sorting_order: number;
  status: BlogFaqStatus;
  created_at: string;
  updated_at: string;
  blog: { id: number; blog_title: string; seo_url: string };
};

/** Mirrors validators/blog-faq.validator.ts's listBlogFaqsQuerySchema. */
export type ListBlogFaqsFilter = {
  blog_id?: number;
};

/** Mirrors validators/blog-faq.validator.ts's createBlogFaqSchema. */
export type CreateBlogFaqInput = {
  blog_id: number;
  title: string;
  text: string;
  sorting_order?: number;
  status?: BlogFaqStatus;
};

export type UpdateBlogFaqInput = Partial<CreateBlogFaqInput>;
