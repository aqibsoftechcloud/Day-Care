/** Centralized TanStack Query keys for the AI Configuration feature. */
export const aiConfigurationsKeys = {
  all: ["ai-configurations"] as const,
  detail: (id: number) => ["ai-configurations", id] as const,
};
