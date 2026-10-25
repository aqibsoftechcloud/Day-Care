/** Centralized TanStack Query keys for the Locations feature. */
export const locationsKeys = {
  all: ["locations"] as const,
  detail: (id: number) => ["locations", id] as const,
};
