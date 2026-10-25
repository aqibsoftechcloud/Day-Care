/**
 * Centralized TanStack Query keys for the Doctor Specialities Management
 * feature. `all` intentionally matches the literal key shape already used
 * by components/admin/doctors/queries.ts's own `doctorSpecialityOptionsKeys.all`
 * (both just list the same `/api/doctor-specialities` data) so both
 * features share one cache entry instead of fetching it twice.
 */
export const doctorSpecialitiesKeys = {
  all: ["doctor-specialities"] as const,
  detail: (id: number) => ["doctor-specialities", id] as const,
};
