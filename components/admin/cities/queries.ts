/** Centralized TanStack Query keys for the Cities feature. */
export const citiesKeys = {
  all: ["cities"] as const,
  detail: (id: number) => ["cities", id] as const,
};
