/** Centralized TanStack Query keys for the Events & Calendar Management feature. */
export const eventsKeys = {
  all: ["events"] as const,
  detail: (id: number) => ["events", id] as const,
};
