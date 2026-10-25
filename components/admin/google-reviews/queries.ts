/** Centralized TanStack Query keys for the Google Reviews feature. */
export const googleReviewsKeys = {
  all: ["google-reviews"] as const,
  detail: (id: number) => ["google-reviews", id] as const,
};
