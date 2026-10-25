/** Centralized TanStack Query keys for the Symptom Checker Symptoms feature. Also used by Articles to populate its "Symptom" picker. */
export const symptomsKeys = {
  all: ["symptoms"] as const,
  detail: (id: number) => ["symptoms", id] as const,
};
