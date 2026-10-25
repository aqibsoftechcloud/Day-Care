/** Centralized TanStack Query keys for the News & Media Management feature. */
export const newsMediaKeys = {
  all: ["news-media"] as const,
  detail: (id: number) => ["news-media", id] as const,
};
