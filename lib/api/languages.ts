import { apiFetch } from "./client";
import type { CreateLanguageInput, Language, UpdateLanguageInput } from "@/types/language";

type LanguagesListResponse = { success: true; languages: Language[] };
type LanguageResponse = { success: true; language: Language };
type DeleteLanguageResponse = { success: true; message: string };

/** No pagination/search/filter query params exist on this endpoint — always returns the full list. */
export function listLanguages() {
  return apiFetch<LanguagesListResponse>("/api/languages");
}

export function getLanguage(id: number) {
  return apiFetch<LanguageResponse>(`/api/languages/${id}`);
}

export function createLanguage(data: CreateLanguageInput) {
  return apiFetch<LanguageResponse>("/api/languages", { method: "POST", body: data });
}

export function updateLanguage(id: number, data: UpdateLanguageInput) {
  return apiFetch<LanguageResponse>(`/api/languages/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive" server-side, never removes the row. */
export function deleteLanguage(id: number) {
  return apiFetch<DeleteLanguageResponse>(`/api/languages/${id}`, { method: "DELETE" });
}
