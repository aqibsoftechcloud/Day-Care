import { apiFetch } from "./client";
import type { HospitalInsuranceMapping, ReorderHospitalInsuranceCompaniesInput } from "@/types/hospital-insurance";

type HospitalInsuranceMappingsListResponse = { success: true; mappings: HospitalInsuranceMapping[] };
type HospitalInsuranceMappingResponse = { success: true; mapping: HospitalInsuranceMapping };
type RemoveHospitalInsuranceCompanyResponse = { success: true; message: string };

export function listHospitalInsuranceCompanies(hospitalId: number) {
  return apiFetch<HospitalInsuranceMappingsListResponse>(`/api/hospitals/${hospitalId}/insurance`);
}

export function addHospitalInsuranceCompany(hospitalId: number, insuranceCompanyId: number) {
  return apiFetch<HospitalInsuranceMappingResponse>(`/api/hospitals/${hospitalId}/insurance`, {
    method: "POST",
    body: { insurance_company_id: insuranceCompanyId },
  });
}

export function reorderHospitalInsuranceCompanies(hospitalId: number, data: ReorderHospitalInsuranceCompaniesInput) {
  return apiFetch<HospitalInsuranceMappingsListResponse>(`/api/hospitals/${hospitalId}/insurance`, {
    method: "PUT",
    body: data,
  });
}

export function removeHospitalInsuranceCompany(hospitalId: number, insuranceCompanyId: number) {
  return apiFetch<RemoveHospitalInsuranceCompanyResponse>(`/api/hospitals/${hospitalId}/insurance/${insuranceCompanyId}`, {
    method: "DELETE",
  });
}
