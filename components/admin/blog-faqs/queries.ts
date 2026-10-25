/**
 * Centralized TanStack Query keys for Blog FAQs — now consumed only from
 * inside the Blog Add/Edit form (the standalone Blog FAQs admin page was
 * removed; FAQs are managed inline per-blog).
 */
export const blogFaqsKeys = {
  all: ["blog-faqs"] as const,
  detail: (id: number) => ["blog-faqs", id] as const,
  byBlog: (blogId: number) => ["blog-faqs", "by-blog", blogId] as const,
};
