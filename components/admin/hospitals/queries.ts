/**
 * Centralized TanStack Query keys for the Hospital Management feature
 * (Hospitals, Hospital FAQs — all gated by the single "hospitals"
 * permission slug). `all` intentionally matches the literal key shape
 * already used by components/admin/specialities/queries.ts's own
 * `hospitalsKeys.all` (both just list the same `/api/hospitals` data) so
 * both features share one cache entry instead of fetching it twice.
 */
export const hospitalsKeys = {
  all: ["hospitals"] as const,
  detail: (id: number) => ["hospitals", id] as const,
};

export const hospitalFaqsKeys = {
  byHospital: (hospitalId: number) => ["hospital-faqs", hospitalId] as const,
  detail: (id: number) => ["hospital-faqs", "detail", id] as const,
};
