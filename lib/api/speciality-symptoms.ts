import { apiFetch } from "./client";
import type {
  CreateSpecialitySymptomInput,
  SpecialitySymptom,
  UpdateSpecialitySymptomInput,
} from "@/types/speciality-symptom";

type SpecialitySymptomsListResponse = { success: true; specialitySymptoms: SpecialitySymptom[] };
type SpecialitySymptomResponse = { success: true; specialitySymptom: SpecialitySymptom };
type DeleteSpecialitySymptomResponse = { success: true; message: string };

/** `speciality_id` (real server filter) scopes the list to one speciality's symptoms; `status` is also server-supported but unused here for the standard client-side status filter pattern used across the CMS. */
export function listSpecialitySymptoms(specialityId: number) {
  return apiFetch<SpecialitySymptomsListResponse>(`/api/speciality-symptoms?speciality_id=${specialityId}`);
}

export function getSpecialitySymptom(id: number) {
  return apiFetch<SpecialitySymptomResponse>(`/api/speciality-symptoms/${id}`);
}

/** Builds the multipart body the actual controller expects (parseMultipartFields) — `image` is a real file, never JSON. */
function toSymptomFormData(data: CreateSpecialitySymptomInput | UpdateSpecialitySymptomInput, image?: File | null): FormData {
  const formData = new FormData();
  if (data.speciality_id !== undefined) formData.append("speciality_id", String(data.speciality_id));
  if (data.name !== undefined) formData.append("name", data.name);
  if (data.sorting_order !== undefined) formData.append("sorting_order", String(data.sorting_order));
  if (data.status) formData.append("status", data.status);
  if (image) formData.append("image", image);
  return formData;
}

export function createSpecialitySymptom(data: CreateSpecialitySymptomInput, image?: File | null) {
  return apiFetch<SpecialitySymptomResponse>("/api/speciality-symptoms", {
    method: "POST",
    body: toSymptomFormData(data, image),
  });
}

/** Image is optional on update — omit it to keep the existing stored image. */
export function updateSpecialitySymptom(id: number, data: UpdateSpecialitySymptomInput, image?: File | null) {
  return apiFetch<SpecialitySymptomResponse>(`/api/speciality-symptoms/${id}`, {
    method: "PUT",
    body: toSymptomFormData(data, image),
  });
}

/** Soft delete — sets status to "inactive" server-side; the stored image is intentionally preserved. */
export function deleteSpecialitySymptom(id: number) {
  return apiFetch<DeleteSpecialitySymptomResponse>(`/api/speciality-symptoms/${id}`, { method: "DELETE" });
}
