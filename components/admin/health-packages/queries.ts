/** Centralized TanStack Query keys for the Health Packages Management feature. */
export const healthPackagesKeys = {
  all: ["health-packages"] as const,
  detail: (id: number) => ["health-packages", id] as const,
};
