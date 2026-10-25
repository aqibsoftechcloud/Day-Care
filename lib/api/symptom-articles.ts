import { apiFetch } from "./client";
import type {
  CreateSymptomArticleInput,
  ListSymptomArticlesFilter,
  SymptomArticle,
  UpdateSymptomArticleInput,
} from "@/types/symptom-article";

type SymptomArticlesListResponse = { success: true; symptomArticles: SymptomArticle[] };
type SymptomArticleResponse = { success: true; symptomArticle: SymptomArticle };
type DeleteSymptomArticleResponse = { success: true; message: string };

function toQueryString(filter?: ListSymptomArticlesFilter): string {
  if (!filter) return "";
  const params = new URLSearchParams();
  if (filter.part_id !== undefined) params.set("part_id", String(filter.part_id));
  if (filter.symptom_id !== undefined) params.set("symptom_id", String(filter.symptom_id));
  if (filter.status !== undefined) params.set("status", filter.status);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listSymptomArticles(filter?: ListSymptomArticlesFilter) {
  return apiFetch<SymptomArticlesListResponse>(`/api/symptom-articles${toQueryString(filter)}`);
}

export function getSymptomArticle(id: number) {
  return apiFetch<SymptomArticleResponse>(`/api/symptom-articles/${id}`);
}

export function createSymptomArticle(data: CreateSymptomArticleInput) {
  return apiFetch<SymptomArticleResponse>("/api/symptom-articles", { method: "POST", body: data });
}

export function updateSymptomArticle(id: number, data: UpdateSymptomArticleInput) {
  return apiFetch<SymptomArticleResponse>(`/api/symptom-articles/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive". Leaf node — no child-protection check. */
export function deleteSymptomArticle(id: number) {
  return apiFetch<DeleteSymptomArticleResponse>(`/api/symptom-articles/${id}`, { method: "DELETE" });
}
