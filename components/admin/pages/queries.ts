/** Centralized TanStack Query keys for the Pages feature. */
export const pagesKeys = {
  all: ["pages"] as const,
  detail: (id: number) => ["pages", id] as const,
};
