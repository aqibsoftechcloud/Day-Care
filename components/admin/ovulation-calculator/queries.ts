/** Centralized TanStack Query keys for the Ovulation Calculator submissions feature (read-only). */
export const ovulationCalculatorKeys = {
  all: ["ovulation-calculator"] as const,
  detail: (id: number) => ["ovulation-calculator", id] as const,
};
