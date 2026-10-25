import { apiFetch } from "./client";
import type {
  CreateSymptomInput,
  ListSymptomsFilter,
  Symptom,
  UpdateSymptomInput,
} from "@/types/symptom";

type SymptomsListResponse = { success: true; symptoms: Symptom[] };
type SymptomResponse = { success: true; symptom: Symptom };
type DeleteSymptomResponse = { success: true; message: string };

function toQueryString(filter?: ListSymptomsFilter): string {
  if (!filter) return "";
  const params = new URLSearchParams();
  if (filter.part_id !== undefined) params.set("part_id", String(filter.part_id));
  if (filter.status !== undefined) params.set("status", filter.status);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Also used by Articles to populate its "Symptom" picker. */
export function listSymptoms(filter?: ListSymptomsFilter) {
  return apiFetch<SymptomsListResponse>(`/api/symptoms${toQueryString(filter)}`);
}

export function getSymptom(id: number) {
  return apiFetch<SymptomResponse>(`/api/symptoms/${id}`);
}

export function createSymptom(data: CreateSymptomInput) {
  return apiFetch<SymptomResponse>("/api/symptoms", { method: "POST", body: data });
}

export function updateSymptom(id: number, data: UpdateSymptomInput) {
  return apiFetch<SymptomResponse>(`/api/symptoms/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive". Refused (409) server-side if the symptom still has active symptom articles. */
export function deleteSymptom(id: number) {
  return apiFetch<DeleteSymptomResponse>(`/api/symptoms/${id}`, { method: "DELETE" });
}
