/** Centralized TanStack Query keys for the Gallery Management feature. */
export const galleryKeys = {
  all: ["gallery"] as const,
  detail: (id: number) => ["gallery", id] as const,
};
