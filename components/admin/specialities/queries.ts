/** Centralized TanStack Query keys for the Speciality Management feature (Specialities, Speciality FAQs, Speciality Symptoms — all gated by the single "specialities" permission slug). */
export const specialitiesKeys = {
  all: ["specialities"] as const,
  detail: (id: number) => ["specialities", id] as const,
};

export const hospitalsKeys = {
  all: ["hospitals"] as const,
};

export const specialityFaqsKeys = {
  bySpeciality: (specialityId: number) => ["speciality-faqs", specialityId] as const,
  detail: (id: number) => ["speciality-faqs", "detail", id] as const,
};

export const specialitySymptomsKeys = {
  bySpeciality: (specialityId: number) => ["speciality-symptoms", specialityId] as const,
  detail: (id: number) => ["speciality-symptoms", "detail", id] as const,
};
