/** Centralized TanStack Query keys for the JS Configuration Management feature. */
export const jsConfigurationsKeys = {
  all: ["js-configurations"] as const,
  detail: (id: number) => ["js-configurations", id] as const,
};
