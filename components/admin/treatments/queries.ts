/** Centralized TanStack Query keys for the Treatment Management feature (Treatments, Treatment FAQs, Treatment Symptoms — all gated by the single "treatments" permission slug). */
export const treatmentsKeys = {
  all: ["treatments"] as const,
  detail: (id: number) => ["treatments", id] as const,
};

export const treatmentFaqsKeys = {
  byTreatment: (treatmentId: number) => ["treatment-faqs", treatmentId] as const,
  detail: (id: number) => ["treatment-faqs", "detail", id] as const,
};

export const treatmentSymptomsKeys = {
  byTreatment: (treatmentId: number) => ["treatment-symptoms", treatmentId] as const,
  detail: (id: number) => ["treatment-symptoms", "detail", id] as const,
};
