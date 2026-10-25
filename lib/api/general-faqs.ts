import { apiFetch } from "./client";
import type { CreateGeneralFaqInput, GeneralFaq, UpdateGeneralFaqInput } from "@/types/general-faq";

type GeneralFaqsListResponse = { success: true; generalFaqs: GeneralFaq[] };
type GeneralFaqResponse = { success: true; generalFaq: GeneralFaq };
type DeleteGeneralFaqResponse = { success: true; message: string };

/** Mirrors validators/general-faq.validator.ts's listGeneralFaqsQuerySchema — `status` only, exact match. */
export function listGeneralFaqs(filter?: { status?: string }) {
  return apiFetch<GeneralFaqsListResponse>("/api/general-faqs", { query: { status: filter?.status } });
}

export function getGeneralFaq(id: number) {
  return apiFetch<GeneralFaqResponse>(`/api/general-faqs/${id}`);
}

export function createGeneralFaq(data: CreateGeneralFaqInput) {
  return apiFetch<GeneralFaqResponse>("/api/general-faqs", { method: "POST", body: data });
}

export function updateGeneralFaq(id: number, data: UpdateGeneralFaqInput) {
  return apiFetch<GeneralFaqResponse>(`/api/general-faqs/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive" server-side. */
export function deleteGeneralFaq(id: number) {
  return apiFetch<DeleteGeneralFaqResponse>(`/api/general-faqs/${id}`, { method: "DELETE" });
}
