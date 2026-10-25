import { apiFetch } from "./client";
import type { CreateDoctorAwardInput, DoctorAward, UpdateDoctorAwardInput } from "@/types/doctor-award";

type DoctorAwardsListResponse = { success: true; doctorAwards: DoctorAward[] };
type DoctorAwardResponse = { success: true; doctorAward: DoctorAward };
type DeleteDoctorAwardResponse = { success: true; message: string };

/** `doctor_id` is the only real server-side filter (validators/doctor-award.validator.ts's listDoctorAwardsQuerySchema) — used here to scope the list to one doctor's awards. */
export function listDoctorAwards(doctorId: number) {
  return apiFetch<DoctorAwardsListResponse>(`/api/doctor-awards?doctor_id=${doctorId}`);
}

export function getDoctorAward(id: number) {
  return apiFetch<DoctorAwardResponse>(`/api/doctor-awards/${id}`);
}

export function createDoctorAward(data: CreateDoctorAwardInput) {
  return apiFetch<DoctorAwardResponse>("/api/doctor-awards", { method: "POST", body: data });
}

export function updateDoctorAward(id: number, data: UpdateDoctorAwardInput) {
  return apiFetch<DoctorAwardResponse>(`/api/doctor-awards/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive" server-side. */
export function deleteDoctorAward(id: number) {
  return apiFetch<DeleteDoctorAwardResponse>(`/api/doctor-awards/${id}`, { method: "DELETE" });
}
