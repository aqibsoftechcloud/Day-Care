import { apiFetch } from "./client";
import type {
  CreateHealthPackageInput,
  HealthPackage,
  ListHealthPackagesFilter,
  UpdateHealthPackageInput,
} from "@/types/health-package";

type HealthPackagesListResponse = { success: true; healthPackages: HealthPackage[] };
type HealthPackageResponse = { success: true; healthPackage: HealthPackage };
type DeleteHealthPackageResponse = { success: true; message: string };

function toQueryString(filter?: ListHealthPackagesFilter): string {
  if (!filter?.status) return "";
  return `?status=${filter.status}`;
}

export function listHealthPackages(filter?: ListHealthPackagesFilter) {
  return apiFetch<HealthPackagesListResponse>(`/api/health-packages${toQueryString(filter)}`);
}

export function getHealthPackage(id: number) {
  return apiFetch<HealthPackageResponse>(`/api/health-packages/${id}`);
}

/** Builds the multipart body the actual controller expects (parseMultipartFields) — pack_image is a real file, package_file is a plain string field (not uploaded). */
function toHealthPackageFormData(data: CreateHealthPackageInput | UpdateHealthPackageInput, image?: File | null): FormData {
  const formData = new FormData();
  if (data.package_title !== undefined) formData.append("package_title", data.package_title);
  if (data.meta_title) formData.append("meta_title", data.meta_title);
  if (data.meta_description) formData.append("meta_description", data.meta_description);
  if (data.meta_keywords) formData.append("meta_keywords", data.meta_keywords);
  if (data.seo_url !== undefined) formData.append("seo_url", data.seo_url);
  if (data.cost !== undefined) formData.append("cost", String(data.cost));
  if (data.package_file) formData.append("package_file", data.package_file);
  if (data.package_inclusions) formData.append("package_inclusions", data.package_inclusions);
  if (data.status) formData.append("status", data.status);
  if (image) formData.append("pack_image", image);
  return formData;
}

export function createHealthPackage(data: CreateHealthPackageInput, image?: File | null) {
  return apiFetch<HealthPackageResponse>("/api/health-packages", {
    method: "POST",
    body: toHealthPackageFormData(data, image),
  });
}

/** Image is optional on update — omit it to keep the existing stored image. */
export function updateHealthPackage(id: number, data: UpdateHealthPackageInput, image?: File | null) {
  return apiFetch<HealthPackageResponse>(`/api/health-packages/${id}`, {
    method: "PUT",
    body: toHealthPackageFormData(data, image),
  });
}

/** Soft delete — sets status to "inactive" server-side; content and the stored image are intentionally preserved. */
export function deleteHealthPackage(id: number) {
  return apiFetch<DeleteHealthPackageResponse>(`/api/health-packages/${id}`, { method: "DELETE" });
}
