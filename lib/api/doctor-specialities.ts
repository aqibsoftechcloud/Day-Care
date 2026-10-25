import { apiFetch } from "./client";
import type {
  CreateDoctorSpecialityInput,
  DoctorSpeciality,
  ListDoctorSpecialitiesFilter,
  UpdateDoctorSpecialityInput,
} from "@/types/doctor-speciality";

type DoctorSpecialitiesListResponse = { success: true; doctorSpecialities: DoctorSpeciality[] };
type DoctorSpecialityResponse = { success: true; doctorSpeciality: DoctorSpeciality };
type DeleteDoctorSpecialityResponse = { success: true; message: string };

function toQueryString(filter?: ListDoctorSpecialitiesFilter): string {
  if (!filter) return "";
  const params = new URLSearchParams();
  if (filter.language_id !== undefined) params.set("language_id", String(filter.language_id));
  if (filter.status !== undefined) params.set("status", filter.status);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Also used by Doctors Management to populate its "map specialities" picker — requires `doctor-specialities.view`, a separate permission from `doctors.*`. */
export function listDoctorSpecialities(filter?: ListDoctorSpecialitiesFilter) {
  return apiFetch<DoctorSpecialitiesListResponse>(`/api/doctor-specialities${toQueryString(filter)}`);
}

export function getDoctorSpeciality(id: number) {
  return apiFetch<DoctorSpecialityResponse>(`/api/doctor-specialities/${id}`);
}

export function createDoctorSpeciality(data: CreateDoctorSpecialityInput) {
  return apiFetch<DoctorSpecialityResponse>("/api/doctor-specialities", { method: "POST", body: data });
}

export function updateDoctorSpeciality(id: number, data: UpdateDoctorSpecialityInput) {
  return apiFetch<DoctorSpecialityResponse>(`/api/doctor-specialities/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive" server-side; does not touch doctor_speciality_mappings (out of scope for this module, per the service's own doc comment). */
export function deleteDoctorSpeciality(id: number) {
  return apiFetch<DeleteDoctorSpecialityResponse>(`/api/doctor-specialities/${id}`, { method: "DELETE" });
}
