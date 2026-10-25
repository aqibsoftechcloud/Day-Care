/** Centralized TanStack Query keys for the Doctors Management feature (Doctors, Hospital mapping, Doctor Speciality mapping — all gated by the "doctors" permission slug). */
export const doctorsKeys = {
  all: ["doctors"] as const,
  detail: (id: number) => ["doctors", id] as const,
};

export const doctorHospitalMappingKeys = {
  byDoctor: (doctorId: number) => ["doctor-hospital-mappings", doctorId] as const,
};

export const doctorSpecialityMappingKeys = {
  byDoctor: (doctorId: number) => ["doctor-speciality-mappings", doctorId] as const,
};

export const doctorAwardsKeys = {
  byDoctor: (doctorId: number) => ["doctor-awards", doctorId] as const,
  detail: (id: number) => ["doctor-awards", "detail", id] as const,
};

export const doctorFaqsKeys = {
  byDoctor: (doctorId: number) => ["doctor-faqs", doctorId] as const,
  detail: (id: number) => ["doctor-faqs", "detail", id] as const,
};

/**
 * Read-only catalog list used only to populate the "map specialities"
 * picker — gated by the separate "doctor-specialities" permission. The key
 * intentionally matches components/admin/doctor-specialities/queries.ts's
 * own `doctorSpecialitiesKeys.all` (both just list the same
 * `/api/doctor-specialities` data) so both features share one cache entry
 * instead of fetching it twice — same precedent as hospitalsKeys.all being
 * shared between Specialities/Treatments and Hospitals Management.
 */
export const doctorSpecialityOptionsKeys = {
  all: ["doctor-specialities"] as const,
  /** Deliberately its own key, not `all` — this is filtered to `status: "active"` for the Doctor Add/Edit combobox, while `all` stays unfiltered for the Manage Specialities picker/admin table. Reusing `all` for a filtered query would corrupt that shared cache entry. */
  active: ["doctor-specialities", "active"] as const,
};

/** Filtered to the doctor's own city + `status: "active"` for the Doctor Add/Edit Hospitals combobox — its own key (not `hospitalsKeys.all`) since that key is the unfiltered list shared by Hospitals Management and Specialities/Treatments' picker. */
export const doctorHospitalOptionsKeys = {
  byCity: (cityId: number) => ["hospitals", "active-by-city", cityId] as const,
};
