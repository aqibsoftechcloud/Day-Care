import { apiFetch } from "./client";
import type { CreateDoctorFaqInput, DoctorFaq, UpdateDoctorFaqInput } from "@/types/doctor-faq";

type DoctorFaqsListResponse = { success: true; doctorFaqs: DoctorFaq[] };
type DoctorFaqResponse = { success: true; doctorFaq: DoctorFaq };
type DeleteDoctorFaqResponse = { success: true; message: string };

/** `doctor_id` is the only real server-side filter (validators/doctor-faq.validator.ts's listDoctorFaqsQuerySchema) — used here to scope the list to one doctor's FAQs. */
export function listDoctorFaqs(doctorId: number) {
  return apiFetch<DoctorFaqsListResponse>(`/api/doctor-faqs?doctor_id=${doctorId}`);
}

export function getDoctorFaq(id: number) {
  return apiFetch<DoctorFaqResponse>(`/api/doctor-faqs/${id}`);
}

export function createDoctorFaq(data: CreateDoctorFaqInput) {
  return apiFetch<DoctorFaqResponse>("/api/doctor-faqs", { method: "POST", body: data });
}

export function updateDoctorFaq(id: number, data: UpdateDoctorFaqInput) {
  return apiFetch<DoctorFaqResponse>(`/api/doctor-faqs/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive" server-side. */
export function deleteDoctorFaq(id: number) {
  return apiFetch<DeleteDoctorFaqResponse>(`/api/doctor-faqs/${id}`, { method: "DELETE" });
}
