/** Centralized TanStack Query keys for the Symptom Checker Parts feature. Also used by Symptoms/Articles to populate their "Part" pickers. */
export const symptomPartsKeys = {
  all: ["symptom-parts"] as const,
  detail: (id: number) => ["symptom-parts", id] as const,
};
