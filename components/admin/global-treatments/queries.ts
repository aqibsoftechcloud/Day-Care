/** Centralized TanStack Query keys for the Global Treatments Management feature (gated by the "global-treatments" permission slug). */
export const globalTreatmentsKeys = {
  all: ["global-treatments"] as const,
  detail: (id: number) => ["global-treatments", id] as const,
};

export const globalTreatmentSectionsKeys = {
  byGlobalTreatment: (globalTreatmentId: number) => ["global-treatment-sections", globalTreatmentId] as const,
};

export const globalTreatmentFaqsKeys = {
  byGlobalTreatment: (globalTreatmentId: number) => ["global-treatment-faqs", globalTreatmentId] as const,
};
