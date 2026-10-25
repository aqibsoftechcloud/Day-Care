/** Centralized TanStack Query keys for the Doctor Pages feature. */
export const doctorPagesKeys = {
  all: ["doctor-pages"] as const,
  detail: (id: number) => ["doctor-pages", id] as const,
};

/** Query key for the Specialities lookup used by this feature's Speciality select. */
export const specialitiesKeys = {
  all: ["specialities"] as const,
};
