import type { InsuranceCompany } from "./insurance-company";

export type HospitalInsuranceMappingStatus = "active" | "inactive";

/** Mirrors services/hospital-insurance.service.ts's select output — the mapping row plus its linked insurance company. */
export type HospitalInsuranceMapping = {
  id: number;
  hospital_id: number;
  insurance_company_id: number;
  sorting_order: number;
  status: HospitalInsuranceMappingStatus;
  created_at: string;
  updated_at: string;
  insurance_companies: InsuranceCompany;
};

export type ReorderHospitalInsuranceCompaniesInput = {
  order: { insurance_company_id: number; sorting_order: number }[];
};
