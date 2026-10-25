/** Centralized TanStack Query keys for the Users feature. */
export const usersKeys = {
  all: ["users"] as const,
  detail: (userId: string) => ["users", userId] as const,
};
