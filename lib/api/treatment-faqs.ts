import { apiFetch } from "./client";
import type { CreateTreatmentFaqInput, TreatmentFaq, UpdateTreatmentFaqInput } from "@/types/treatment-faq";

type TreatmentFaqsListResponse = { success: true; treatmentFaqs: TreatmentFaq[] };
type TreatmentFaqResponse = { success: true; treatmentFaq: TreatmentFaq };
type DeleteTreatmentFaqResponse = { success: true; message: string };

/** `treatment_id` is the only real server-side filter (validators/treatment-faq.validator.ts's listTreatmentFaqsQuerySchema) — used here to scope the list to one treatment's FAQs. */
export function listTreatmentFaqs(treatmentId: number) {
  return apiFetch<TreatmentFaqsListResponse>(`/api/treatment-faqs?treatment_id=${treatmentId}`);
}

export function getTreatmentFaq(id: number) {
  return apiFetch<TreatmentFaqResponse>(`/api/treatment-faqs/${id}`);
}

export function createTreatmentFaq(data: CreateTreatmentFaqInput) {
  return apiFetch<TreatmentFaqResponse>("/api/treatment-faqs", { method: "POST", body: data });
}

export function updateTreatmentFaq(id: number, data: UpdateTreatmentFaqInput) {
  return apiFetch<TreatmentFaqResponse>(`/api/treatment-faqs/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive" server-side. */
export function deleteTreatmentFaq(id: number) {
  return apiFetch<DeleteTreatmentFaqResponse>(`/api/treatment-faqs/${id}`, { method: "DELETE" });
}
