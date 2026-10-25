import { apiFetch } from "./client";
import type { CreateSpecialityFaqInput, SpecialityFaq, UpdateSpecialityFaqInput } from "@/types/speciality-faq";

type SpecialityFaqsListResponse = { success: true; specialityFaqs: SpecialityFaq[] };
type SpecialityFaqResponse = { success: true; specialityFaq: SpecialityFaq };
type DeleteSpecialityFaqResponse = { success: true; message: string };

/** `speciality_id` is the only real server-side filter (validators/speciality-faq.validator.ts's listSpecialityFaqsQuerySchema) — used here to scope the list to one speciality's FAQs. */
export function listSpecialityFaqs(specialityId: number) {
  return apiFetch<SpecialityFaqsListResponse>(`/api/speciality-faqs?speciality_id=${specialityId}`);
}

export function getSpecialityFaq(id: number) {
  return apiFetch<SpecialityFaqResponse>(`/api/speciality-faqs/${id}`);
}

export function createSpecialityFaq(data: CreateSpecialityFaqInput) {
  return apiFetch<SpecialityFaqResponse>("/api/speciality-faqs", { method: "POST", body: data });
}

export function updateSpecialityFaq(id: number, data: UpdateSpecialityFaqInput) {
  return apiFetch<SpecialityFaqResponse>(`/api/speciality-faqs/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive" server-side. */
export function deleteSpecialityFaq(id: number) {
  return apiFetch<DeleteSpecialityFaqResponse>(`/api/speciality-faqs/${id}`, { method: "DELETE" });
}
