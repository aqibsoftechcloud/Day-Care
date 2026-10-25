/** Centralized TanStack Query keys for the Banners feature. */
export const bannersKeys = {
  all: ["banners"] as const,
  detail: (id: number) => ["banners", id] as const,
};
