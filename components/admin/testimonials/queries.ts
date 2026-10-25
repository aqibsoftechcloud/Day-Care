/** Centralized TanStack Query keys for the Testimonial Management feature. */
export const testimonialsKeys = {
  all: ["testimonials"] as const,
  detail: (id: number) => ["testimonials", id] as const,
};

/**
 * Read-only catalog list used only to populate the Speciality picker.
 * Filtered to `status: "active"`, so it needs its own key, not
 * `specialitiesKeys.all` (components/admin/specialities/queries.ts) —
 * that key is the unfiltered list shared by Speciality Management itself;
 * reusing it here for a filtered query would corrupt that cache entry.
 */
export const specialityOptionsKeys = {
  active: ["specialities", "active"] as const,
};
