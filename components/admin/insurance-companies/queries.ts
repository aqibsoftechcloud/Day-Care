export const insuranceCompaniesKeys = {
  all: ["insurance-companies"] as const,
  detail: (id: number) => ["insurance-companies", id] as const,
};
