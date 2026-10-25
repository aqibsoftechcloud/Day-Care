import { apiFetch } from "./client";
import type {
  CreateGlobalTreatmentInput,
  GlobalTreatment,
  ListGlobalTreatmentsFilter,
  UpdateGlobalTreatmentInput,
} from "@/types/global-treatment";

type GlobalTreatmentsListResponse = { success: true; globalTreatments: GlobalTreatment[] };
type GlobalTreatmentResponse = { success: true; globalTreatment: GlobalTreatment };
type DeleteGlobalTreatmentResponse = { success: true; message: string };

function toQueryString(filter?: ListGlobalTreatmentsFilter): string {
  if (!filter) return "";
  const params = new URLSearchParams();
  if (filter.status !== undefined) params.set("status", filter.status);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listGlobalTreatments(filter?: ListGlobalTreatmentsFilter) {
  return apiFetch<GlobalTreatmentsListResponse>(`/api/global-treatments${toQueryString(filter)}`);
}

export function getGlobalTreatment(id: number) {
  return apiFetch<GlobalTreatmentResponse>(`/api/global-treatments/${id}`);
}

/** Builds the multipart body the actual controller expects (parseMultipartFields) — `image` is a real file, never JSON. No city/hospital/location/speciality fields — a global treatment is city-independent by design. */
function toGlobalTreatmentFormData(data: CreateGlobalTreatmentInput | UpdateGlobalTreatmentInput, image?: File | null, cardIcon?: File | null): FormData {
  const formData = new FormData();
  if (data.treatment_name !== undefined) formData.append("treatment_name", data.treatment_name);
  if (data.treatment_title) formData.append("treatment_title", data.treatment_title);
  if (data.seo_url !== undefined) formData.append("seo_url", data.seo_url);
  if (data.short_description) formData.append("short_description", data.short_description);
  if (data.description) formData.append("description", data.description);
  if (data.meta_title) formData.append("meta_title", data.meta_title);
  if (data.meta_description) formData.append("meta_description", data.meta_description);
  if (data.meta_keyword) formData.append("meta_keyword", data.meta_keyword);
  if (data.global_speciality_id !== undefined) {
    // `null` (explicit clear) is sent as the empty-string sentinel the
    // validator's preprocess step maps back to real `null` — multipart
    // fields have no native null. Omitting the key entirely (the
    // `undefined` case) means "leave unchanged".
    formData.append("global_speciality_id", data.global_speciality_id === null ? "" : String(data.global_speciality_id));
  }
  if (data.status) formData.append("status", data.status);
  if (image) {
    formData.append("image", image);
  } else if (image === null) {
    // Explicit clear sentinel the controller's resolveImageInput() checks for.
    formData.append("image", "");
  }
  // Independent of `image` above — same upload / "" = clear / omitted = keep contract.
  if (cardIcon) {
    formData.append("card_icon", cardIcon);
  } else if (cardIcon === null) {
    formData.append("card_icon", "");
  }
  return formData;
}

export function createGlobalTreatment(data: CreateGlobalTreatmentInput, image?: File | null, cardIcon?: File | null) {
  return apiFetch<GlobalTreatmentResponse>("/api/global-treatments", {
    method: "POST",
    body: toGlobalTreatmentFormData(data, image, cardIcon),
  });
}

/** Image is optional on update — omit it to keep the existing stored image. */
export function updateGlobalTreatment(id: number, data: UpdateGlobalTreatmentInput, image?: File | null, cardIcon?: File | null) {
  return apiFetch<GlobalTreatmentResponse>(`/api/global-treatments/${id}`, {
    method: "PUT",
    body: toGlobalTreatmentFormData(data, image, cardIcon),
  });
}

/** Soft delete — sets status to "inactive" server-side; the stored image and any city links are intentionally preserved. */
export function deleteGlobalTreatment(id: number) {
  return apiFetch<DeleteGlobalTreatmentResponse>(`/api/global-treatments/${id}`, { method: "DELETE" });
}
