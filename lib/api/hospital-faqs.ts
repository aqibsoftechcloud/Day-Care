import { apiFetch } from "./client";
import type { CreateHospitalFaqInput, HospitalFaq, UpdateHospitalFaqInput } from "@/types/hospital-faq";

type HospitalFaqsListResponse = { success: true; hospitalFaqs: HospitalFaq[] };
type HospitalFaqResponse = { success: true; hospitalFaq: HospitalFaq };
type DeleteHospitalFaqResponse = { success: true; message: string };

/** `hospital_id` is the only real server-side filter (validators/hospital-faq.validator.ts's listHospitalFaqsQuerySchema) — used here to scope the list to one hospital's FAQs. */
export function listHospitalFaqs(hospitalId: number) {
  return apiFetch<HospitalFaqsListResponse>(`/api/hospital-faqs?hospital_id=${hospitalId}`);
}

export function getHospitalFaq(id: number) {
  return apiFetch<HospitalFaqResponse>(`/api/hospital-faqs/${id}`);
}

export function createHospitalFaq(data: CreateHospitalFaqInput) {
  return apiFetch<HospitalFaqResponse>("/api/hospital-faqs", { method: "POST", body: data });
}

export function updateHospitalFaq(id: number, data: UpdateHospitalFaqInput) {
  return apiFetch<HospitalFaqResponse>(`/api/hospital-faqs/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive" server-side. */
export function deleteHospitalFaq(id: number) {
  return apiFetch<DeleteHospitalFaqResponse>(`/api/hospital-faqs/${id}`, { method: "DELETE" });
}
