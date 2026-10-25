import { apiFetch } from "./client";
import type {
  CreateGlobalTreatmentFaqInput,
  GlobalTreatmentFaq,
  UpdateGlobalTreatmentFaqInput,
} from "@/types/global-treatment-faq";

type GlobalTreatmentFaqsListResponse = { success: true; globalTreatmentFaqs: GlobalTreatmentFaq[] };
type GlobalTreatmentFaqResponse = { success: true; globalTreatmentFaq: GlobalTreatmentFaq };
type DeleteGlobalTreatmentFaqResponse = { success: true; message: string };

export function listGlobalTreatmentFaqs(globalTreatmentId: number) {
  return apiFetch<GlobalTreatmentFaqsListResponse>(`/api/global-treatment-faqs?global_treatment_id=${globalTreatmentId}`);
}

export function createGlobalTreatmentFaq(data: CreateGlobalTreatmentFaqInput) {
  return apiFetch<GlobalTreatmentFaqResponse>("/api/global-treatment-faqs", { method: "POST", body: data });
}

export function updateGlobalTreatmentFaq(id: number, data: UpdateGlobalTreatmentFaqInput) {
  return apiFetch<GlobalTreatmentFaqResponse>(`/api/global-treatment-faqs/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive" server-side. */
export function deleteGlobalTreatmentFaq(id: number) {
  return apiFetch<DeleteGlobalTreatmentFaqResponse>(`/api/global-treatment-faqs/${id}`, { method: "DELETE" });
}
