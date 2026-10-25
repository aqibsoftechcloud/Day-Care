import { apiFetch } from "./client";
import type {
  CreateInsuranceCompanyInput,
  InsuranceCompany,
  ListInsuranceCompaniesFilter,
  UpdateInsuranceCompanyInput,
} from "@/types/insurance-company";

type InsuranceCompaniesListResponse = { success: true; insuranceCompanies: InsuranceCompany[] };
type InsuranceCompanyResponse = { success: true; insuranceCompany: InsuranceCompany };
type DeleteInsuranceCompanyResponse = { success: true; message: string };

function toQueryString(filter?: ListInsuranceCompaniesFilter): string {
  if (!filter) return "";
  const params = new URLSearchParams();
  if (filter.status !== undefined) params.set("status", filter.status);
  if (filter.search !== undefined) params.set("search", filter.search);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Builds the multipart body the actual controller expects (parseMultipartFields) — `logo` is a real file, never JSON. */
function toInsuranceCompanyFormData(
  data: CreateInsuranceCompanyInput | UpdateInsuranceCompanyInput,
  logo?: File | null
): FormData {
  const formData = new FormData();
  if (data.name !== undefined) formData.append("name", data.name);
  if (data.seo_url !== undefined) formData.append("seo_url", data.seo_url);
  if (data.description) formData.append("description", data.description);
  if (data.status !== undefined) formData.append("status", data.status);
  if (logo) formData.append("logo", logo);
  return formData;
}

export function listInsuranceCompanies(filter?: ListInsuranceCompaniesFilter) {
  return apiFetch<InsuranceCompaniesListResponse>(`/api/insurance-companies${toQueryString(filter)}`);
}

export function getInsuranceCompany(id: number) {
  return apiFetch<InsuranceCompanyResponse>(`/api/insurance-companies/${id}`);
}

export function createInsuranceCompany(data: CreateInsuranceCompanyInput, logo?: File | null) {
  return apiFetch<InsuranceCompanyResponse>("/api/insurance-companies", {
    method: "POST",
    body: toInsuranceCompanyFormData(data, logo),
  });
}

/** Logo is optional on update — omit it to keep the existing stored logo. */
export function updateInsuranceCompany(id: number, data: UpdateInsuranceCompanyInput, logo?: File | null) {
  return apiFetch<InsuranceCompanyResponse>(`/api/insurance-companies/${id}`, {
    method: "PUT",
    body: toInsuranceCompanyFormData(data, logo),
  });
}

/** Hard delete — rejected (400) server-side if the company is still mapped to any hospital. */
export function deleteInsuranceCompany(id: number) {
  return apiFetch<DeleteInsuranceCompanyResponse>(`/api/insurance-companies/${id}`, { method: "DELETE" });
}
