import { apiFetch } from "./client";
import type {
  CreateGlobalSpecialityFaqInput,
  GlobalSpecialityFaq,
  UpdateGlobalSpecialityFaqInput,
} from "@/types/global-speciality-faq";

type GlobalSpecialityFaqsListResponse = { success: true; globalSpecialityFaqs: GlobalSpecialityFaq[] };
type GlobalSpecialityFaqResponse = { success: true; globalSpecialityFaq: GlobalSpecialityFaq };
type DeleteGlobalSpecialityFaqResponse = { success: true; message: string };

export function listGlobalSpecialityFaqs(globalSpecialityId: number) {
  return apiFetch<GlobalSpecialityFaqsListResponse>(`/api/global-speciality-faqs?global_speciality_id=${globalSpecialityId}`);
}

export function createGlobalSpecialityFaq(data: CreateGlobalSpecialityFaqInput) {
  return apiFetch<GlobalSpecialityFaqResponse>("/api/global-speciality-faqs", { method: "POST", body: data });
}

export function updateGlobalSpecialityFaq(id: number, data: UpdateGlobalSpecialityFaqInput) {
  return apiFetch<GlobalSpecialityFaqResponse>(`/api/global-speciality-faqs/${id}`, { method: "PUT", body: data });
}

export function deleteGlobalSpecialityFaq(id: number) {
  return apiFetch<DeleteGlobalSpecialityFaqResponse>(`/api/global-speciality-faqs/${id}`, { method: "DELETE" });
}
