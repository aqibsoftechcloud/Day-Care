import { apiFetch } from "./client";
import type { CreateHospitalInput, Hospital, ListHospitalsFilter, UpdateHospitalInput } from "@/types/hospital";

type HospitalsListResponse = { success: true; hospitals: Hospital[] };
type HospitalResponse = { success: true; hospital: Hospital };
type DeleteHospitalResponse = { success: true; message: string };

function toQueryString(filter?: ListHospitalsFilter): string {
  if (!filter) return "";
  const params = new URLSearchParams();
  if (filter.city_id !== undefined) params.set("city_id", String(filter.city_id));
  if (filter.status !== undefined) params.set("status", filter.status);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Builds the multipart body the actual controller expects
 * (parseMultipartFields) — `hospital_image_file` is a real file, sent
 * under its own field name so it never collides with the plain-text
 * `hospital_image` field (still supported, for pasting an external URL
 * directly — unchanged, pre-existing behavior); the server prefers the
 * uploaded file over the text value when both are present.
 */
function toHospitalFormData(data: CreateHospitalInput | UpdateHospitalInput, image?: File | null): FormData {
  const formData = new FormData();
  if (data.hospital_name !== undefined) formData.append("hospital_name", data.hospital_name);
  if (data.city_id !== undefined) formData.append("city_id", String(data.city_id));
  if (data.location_id !== undefined && data.location_id !== null) {
    formData.append("location_id", String(data.location_id));
  }
  if (data.meta_title) formData.append("meta_title", data.meta_title);
  if (data.meta_description) formData.append("meta_description", data.meta_description);
  if (data.meta_keywords) formData.append("meta_keywords", data.meta_keywords);
  if (data.seo_url !== undefined) formData.append("seo_url", data.seo_url);
  if (data.phone_number) formData.append("phone_number", data.phone_number);
  if (data.timings) formData.append("timings", data.timings);
  if (data.address) formData.append("address", data.address);
  if (data.hospital_image) formData.append("hospital_image", data.hospital_image);
  if (data.google_reviews !== undefined && data.google_reviews !== null) {
    formData.append("google_reviews", String(data.google_reviews));
  }
  if (data.patient_satisfaction_score !== undefined && data.patient_satisfaction_score !== null) {
    formData.append("patient_satisfaction_score", String(data.patient_satisfaction_score));
  }
  if (data.location_360_view) formData.append("location_360_view", data.location_360_view);
  if (data.location_map) formData.append("location_map", data.location_map);
  if (data.hospital_description) formData.append("hospital_description", data.hospital_description);
  if (data.long_description) formData.append("long_description", data.long_description);
  if (data.status !== undefined) formData.append("status", data.status);
  if (image) formData.append("hospital_image_file", image);
  return formData;
}

/** `filter` is optional and defaults to the full list — Specialities/Treatments' own no-arg call to populate their optional Hospital select continues to work unchanged. */
export function listHospitals(filter?: ListHospitalsFilter) {
  return apiFetch<HospitalsListResponse>(`/api/hospitals${toQueryString(filter)}`);
}

export function getHospital(id: number) {
  return apiFetch<HospitalResponse>(`/api/hospitals/${id}`);
}

export function createHospital(data: CreateHospitalInput, image?: File | null) {
  return apiFetch<HospitalResponse>("/api/hospitals", { method: "POST", body: toHospitalFormData(data, image) });
}

/** Image is optional on update — omit it to keep the existing stored `hospital_image` value. */
export function updateHospital(id: number, data: UpdateHospitalInput, image?: File | null) {
  return apiFetch<HospitalResponse>(`/api/hospitals/${id}`, { method: "PUT", body: toHospitalFormData(data, image) });
}

/** Soft delete — sets status to "inactive" server-side. */
export function deleteHospital(id: number) {
  return apiFetch<DeleteHospitalResponse>(`/api/hospitals/${id}`, { method: "DELETE" });
}
