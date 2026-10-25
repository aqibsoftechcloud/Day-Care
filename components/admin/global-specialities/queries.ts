/** Centralized TanStack Query keys for the Global Specialities Management feature (gated by the "global-specialities" permission slug). */
export const globalSpecialitiesKeys = {
  all: ["global-specialities"] as const,
  detail: (id: number) => ["global-specialities", id] as const,
  /** Deliberately its own key, not `all` — this is filtered to `status: "active"` for the Global Treatment form's speciality picker, while `all` stays unfiltered for Global Specialities Management's own admin table. Reusing `all` for a filtered query would corrupt that shared cache entry (same precedent as `doctorSpecialityOptionsKeys.active`). */
  active: ["global-specialities", "active"] as const,
};

export const globalSpecialitySectionsKeys = {
  byGlobalSpeciality: (globalSpecialityId: number) => ["global-speciality-sections", globalSpecialityId] as const,
};

export const globalSpecialityFaqsKeys = {
  byGlobalSpeciality: (globalSpecialityId: number) => ["global-speciality-faqs", globalSpecialityId] as const,
};

export const globalSpecialityNavigationKeys = {
  byGlobalSpeciality: (globalSpecialityId: number) => ["global-speciality-navigation", globalSpecialityId] as const,
};
