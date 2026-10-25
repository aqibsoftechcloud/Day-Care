/** Centralized TanStack Query keys for the Languages feature. */
export const languagesKeys = {
  all: ["languages"] as const,
  detail: (id: number) => ["languages", id] as const,
};
