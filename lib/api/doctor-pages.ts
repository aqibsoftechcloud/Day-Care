import { apiFetch } from "./client";
import type { CreateDoctorPageInput, DoctorPage, UpdateDoctorPageInput } from "@/types/doctor-page";

type DoctorPagesListResponse = { success: true; doctorPages: DoctorPage[] };
type DoctorPageResponse = { success: true; doctorPage: DoctorPage };
type DeleteDoctorPageResponse = { success: true; message: string };

/** No pagination/search/filter query params exist on this endpoint — always returns the full list. */
export function listDoctorPages() {
  return apiFetch<DoctorPagesListResponse>("/api/doctor-pages");
}

export function getDoctorPage(id: number) {
  return apiFetch<DoctorPageResponse>(`/api/doctor-pages/${id}`);
}

export function createDoctorPage(data: CreateDoctorPageInput) {
  return apiFetch<DoctorPageResponse>("/api/doctor-pages", { method: "POST", body: data });
}

export function updateDoctorPage(id: number, data: UpdateDoctorPageInput) {
  return apiFetch<DoctorPageResponse>(`/api/doctor-pages/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive" server-side. */
export function deleteDoctorPage(id: number) {
  return apiFetch<DeleteDoctorPageResponse>(`/api/doctor-pages/${id}`, { method: "DELETE" });
}
