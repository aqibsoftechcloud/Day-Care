/** Centralized TanStack Query keys for the Blog Categories Management feature. Also used by Blogs Management to populate its "Category" select. */
export const blogCategoriesKeys = {
  all: ["blog-categories"] as const,
  detail: (id: number) => ["blog-categories", id] as const,
};
