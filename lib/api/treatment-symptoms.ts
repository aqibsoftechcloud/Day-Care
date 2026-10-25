import { apiFetch } from "./client";
import type {
  CreateTreatmentSymptomInput,
  TreatmentSymptom,
  UpdateTreatmentSymptomInput,
} from "@/types/treatment-symptom";

type TreatmentSymptomsListResponse = { success: true; treatmentSymptoms: TreatmentSymptom[] };
type TreatmentSymptomResponse = { success: true; treatmentSymptom: TreatmentSymptom };
type DeleteTreatmentSymptomResponse = { success: true; message: string };

/** `treatment_id` (real server filter) scopes the list to one treatment's symptoms. */
export function listTreatmentSymptoms(treatmentId: number) {
  return apiFetch<TreatmentSymptomsListResponse>(`/api/treatment-symptoms?treatment_id=${treatmentId}`);
}

export function getTreatmentSymptom(id: number) {
  return apiFetch<TreatmentSymptomResponse>(`/api/treatment-symptoms/${id}`);
}

/** Builds the multipart body the actual controller expects (parseMultipartFields) — `image` is a real file, never JSON. */
function toSymptomFormData(data: CreateTreatmentSymptomInput | UpdateTreatmentSymptomInput, image?: File | null): FormData {
  const formData = new FormData();
  if (data.treatment_id !== undefined) formData.append("treatment_id", String(data.treatment_id));
  if (data.name !== undefined) formData.append("name", data.name);
  if (data.sorting_order !== undefined) formData.append("sorting_order", String(data.sorting_order));
  if (data.status) formData.append("status", data.status);
  if (image) formData.append("image", image);
  return formData;
}

export function createTreatmentSymptom(data: CreateTreatmentSymptomInput, image?: File | null) {
  return apiFetch<TreatmentSymptomResponse>("/api/treatment-symptoms", {
    method: "POST",
    body: toSymptomFormData(data, image),
  });
}

/** Image is optional on update — omit it to keep the existing stored image. */
export function updateTreatmentSymptom(id: number, data: UpdateTreatmentSymptomInput, image?: File | null) {
  return apiFetch<TreatmentSymptomResponse>(`/api/treatment-symptoms/${id}`, {
    method: "PUT",
    body: toSymptomFormData(data, image),
  });
}

/** Soft delete — sets status to "inactive" server-side; the stored image is intentionally preserved. */
export function deleteTreatmentSymptom(id: number) {
  return apiFetch<DeleteTreatmentSymptomResponse>(`/api/treatment-symptoms/${id}`, { method: "DELETE" });
}
