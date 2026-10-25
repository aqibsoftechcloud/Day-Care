/** Centralized TanStack Query keys for the General FAQs feature. */
export const generalFaqsKeys = {
  all: ["general-faqs"] as const,
  detail: (id: number) => ["general-faqs", id] as const,
};
