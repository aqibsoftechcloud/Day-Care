/** Centralized TanStack Query keys for the Symptom Checker Articles feature. */
export const symptomArticlesKeys = {
  all: ["symptom-articles"] as const,
  detail: (id: number) => ["symptom-articles", id] as const,
};
