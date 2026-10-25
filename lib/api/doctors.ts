import { apiFetch } from "./client";
import type {
  CreateDoctorInput,
  Doctor,
  ListDoctorsFilter,
  UpdateDoctorInput,
} from "@/types/doctor";

type DoctorsListResponse = { success: true; doctors: Doctor[] };
type DoctorResponse = { success: true; doctor: Doctor };
type DeleteDoctorResponse = { success: true; message: string };

function toQueryString(filter?: ListDoctorsFilter): string {
  if (!filter) return "";
  const params = new URLSearchParams();
  if (filter.language_id !== undefined) params.set("language_id", String(filter.language_id));
  if (filter.city_id !== undefined) params.set("city_id", String(filter.city_id));
  if (filter.location_id !== undefined) params.set("location_id", String(filter.location_id));
  if (filter.status !== undefined) params.set("status", filter.status);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listDoctors(filter?: ListDoctorsFilter) {
  return apiFetch<DoctorsListResponse>(`/api/doctors${toQueryString(filter)}`);
}

export function getDoctor(id: number) {
  return apiFetch<DoctorResponse>(`/api/doctors/${id}`);
}

/** Builds the multipart body the actual controller expects (parseMultipartFields) — doctor_image is a real file, never JSON. `schema_tags` is deliberately never sent (see types/doctor.ts). */
function toDoctorFormData(data: CreateDoctorInput | UpdateDoctorInput, image?: File | null): FormData {
  const formData = new FormData();
  if (data.language_id !== undefined) formData.append("language_id", String(data.language_id));
  if (data.doctor_name !== undefined) formData.append("doctor_name", data.doctor_name);
  if (data.meta_title) formData.append("meta_title", data.meta_title);
  if (data.seo_url !== undefined) formData.append("seo_url", data.seo_url);
  if (data.meta_description) formData.append("meta_description", data.meta_description);
  if (data.meta_keywords) formData.append("meta_keywords", data.meta_keywords);
  if (data.qualification) formData.append("qualification", data.qualification);
  if (data.experience) formData.append("experience", data.experience);
  if (data.availability) formData.append("availability", data.availability);
  if (data.city_id !== undefined) formData.append("city_id", String(data.city_id));
  if (data.location_id !== undefined && data.location_id !== null) {
    formData.append("location_id", String(data.location_id));
  }
  if (data.patient_satisfaction_score !== undefined && data.patient_satisfaction_score !== null) {
    formData.append("patient_satisfaction_score", String(data.patient_satisfaction_score));
  }
  if (data.sorting_order !== undefined) formData.append("sorting_order", String(data.sorting_order));
  if (data.mon_sat_first_timings) formData.append("mon_sat_first_timings", data.mon_sat_first_timings);
  if (data.mon_sat_second_timings) formData.append("mon_sat_second_timings", data.mon_sat_second_timings);
  if (data.sunday_timings) formData.append("sunday_timings", data.sunday_timings);
  if (data.time_interval) formData.append("time_interval", data.time_interval);
  if (data.location_map) formData.append("location_map", data.location_map);
  if (data.doctor_description) formData.append("doctor_description", data.doctor_description);
  if (data.ai_content_generator !== undefined) {
    formData.append("ai_content_generator", String(data.ai_content_generator));
  }
  if (data.doc_info) formData.append("doc_info", data.doc_info);
  if (data.latitude !== undefined && data.latitude !== null) formData.append("latitude", String(data.latitude));
  if (data.longitude !== undefined && data.longitude !== null) formData.append("longitude", String(data.longitude));
  if (data.status) formData.append("status", data.status);
  if (image) formData.append("doctor_image", image);
  return formData;
}

export function createDoctor(data: CreateDoctorInput, image?: File | null) {
  return apiFetch<DoctorResponse>("/api/doctors", {
    method: "POST",
    body: toDoctorFormData(data, image),
  });
}

/** Image is optional on update — omit it to keep the existing stored image. */
export function updateDoctor(id: number, data: UpdateDoctorInput, image?: File | null) {
  return apiFetch<DoctorResponse>(`/api/doctors/${id}`, {
    method: "PUT",
    body: toDoctorFormData(data, image),
  });
}

/** Soft delete — sets status to "inactive" server-side; the stored image and hospital/speciality mappings are intentionally preserved. */
export function deleteDoctor(id: number) {
  return apiFetch<DeleteDoctorResponse>(`/api/doctors/${id}`, { method: "DELETE" });
}
