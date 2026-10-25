export type InsuranceCompanyStatus = "active" | "inactive";

/** Mirrors services/insurance-company.service.ts's select output. */
export type InsuranceCompany = {
  id: number;
  name: string;
  seo_url: string;
  logo: string | null;
  description: string | null;
  status: InsuranceCompanyStatus;
  created_at: string;
  updated_at: string;
};

export type CreateInsuranceCompanyInput = {
  name: string;
  seo_url: string;
  logo?: string | null;
  description?: string | null;
  status?: InsuranceCompanyStatus;
};

export type UpdateInsuranceCompanyInput = Partial<CreateInsuranceCompanyInput>;

export type ListInsuranceCompaniesFilter = {
  status?: InsuranceCompanyStatus;
  search?: string;
};
