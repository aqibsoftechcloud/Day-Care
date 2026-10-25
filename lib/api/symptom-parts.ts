import { apiFetch } from "./client";
import type {
  CreateSymptomPartInput,
  ListSymptomPartsFilter,
  SymptomPart,
  UpdateSymptomPartInput,
} from "@/types/symptom-part";

type SymptomPartsListResponse = { success: true; symptomParts: SymptomPart[] };
type SymptomPartResponse = { success: true; symptomPart: SymptomPart };
type DeleteSymptomPartResponse = { success: true; message: string };

function toQueryString(filter?: ListSymptomPartsFilter): string {
  if (!filter?.status) return "";
  return `?status=${filter.status}`;
}

/** Also used by Symptoms/Articles to populate their "Part" pickers. */
export function listSymptomParts(filter?: ListSymptomPartsFilter) {
  return apiFetch<SymptomPartsListResponse>(`/api/symptom-parts${toQueryString(filter)}`);
}

export function getSymptomPart(id: number) {
  return apiFetch<SymptomPartResponse>(`/api/symptom-parts/${id}`);
}

export function createSymptomPart(data: CreateSymptomPartInput) {
  return apiFetch<SymptomPartResponse>("/api/symptom-parts", { method: "POST", body: data });
}

export function updateSymptomPart(id: number, data: UpdateSymptomPartInput) {
  return apiFetch<SymptomPartResponse>(`/api/symptom-parts/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive". Refused (409) server-side if the part still has active symptoms or symptom articles. */
export function deleteSymptomPart(id: number) {
  return apiFetch<DeleteSymptomPartResponse>(`/api/symptom-parts/${id}`, { method: "DELETE" });
}
