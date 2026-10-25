/** Centralized TanStack Query keys for the Blogs Management feature. */
export const blogsKeys = {
  all: ["blogs"] as const,
  detail: (id: number) => ["blogs", id] as const,
};
