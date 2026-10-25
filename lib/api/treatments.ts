import { apiFetch } from "./client";
import type {
  CreateTreatmentInput,
  ListTreatmentsFilter,
  Treatment,
  UpdateTreatmentInput,
} from "@/types/treatment";

type TreatmentsListResponse = { success: true; treatments: Treatment[] };
type TreatmentResponse = { success: true; treatment: Treatment };
type DeleteTreatmentResponse = { success: true; message: string };

function toQueryString(filter?: ListTreatmentsFilter): string {
  if (!filter) return "";
  const params = new URLSearchParams();
  if (filter.speciality_id !== undefined) params.set("speciality_id", String(filter.speciality_id));
  if (filter.language_id !== undefined) params.set("language_id", String(filter.language_id));
  if (filter.city_id !== undefined) params.set("city_id", String(filter.city_id));
  if (filter.location_id !== undefined) params.set("location_id", String(filter.location_id));
  if (filter.hospital_id !== undefined) params.set("hospital_id", String(filter.hospital_id));
  if (filter.status !== undefined) params.set("status", filter.status);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listTreatments(filter?: ListTreatmentsFilter) {
  return apiFetch<TreatmentsListResponse>(`/api/treatments${toQueryString(filter)}`);
}

export function getTreatment(id: number) {
  return apiFetch<TreatmentResponse>(`/api/treatments/${id}`);
}

/** Builds the multipart body the actual controller expects (parseMultipartFields) — speciality_logo is a real file, never JSON. */
function toTreatmentFormData(data: CreateTreatmentInput | UpdateTreatmentInput, image?: File | null, cardIcon?: File | null): FormData {
  const formData = new FormData();
  if (data.speciality_id !== undefined) formData.append("speciality_id", String(data.speciality_id));
  if (data.sub_speciality_name !== undefined) formData.append("sub_speciality_name", data.sub_speciality_name);
  if (data.sub_speciality_title) formData.append("sub_speciality_title", data.sub_speciality_title);
  if (data.seo_url !== undefined) formData.append("seo_url", data.seo_url);
  if (data.meta_title) formData.append("meta_title", data.meta_title);
  if (data.meta_description) formData.append("meta_description", data.meta_description);
  if (data.meta_keyword) formData.append("meta_keyword", data.meta_keyword);
  if (data.language_id !== undefined) formData.append("language_id", String(data.language_id));
  if (data.city_id !== undefined) formData.append("city_id", String(data.city_id));
  if (data.location_id !== undefined && data.location_id !== null) {
    formData.append("location_id", String(data.location_id));
  }
  if (data.hospital_id !== undefined && data.hospital_id !== null) {
    formData.append("hospital_id", String(data.hospital_id));
  }
  if (data.short_description) formData.append("short_description", data.short_description);
  if (data.global_treatment_id !== undefined) {
    formData.append("global_treatment_id", data.global_treatment_id === null ? "" : String(data.global_treatment_id));
  }
  if (data.keywords_for_doctors) formData.append("keywords_for_doctors", data.keywords_for_doctors);
  if (data.status) formData.append("status", data.status);
  if (data.ai_content_generator !== undefined) {
    formData.append("ai_content_generator", String(data.ai_content_generator));
  }
  if (data.description) formData.append("description", data.description);
  if (image) formData.append("speciality_logo", image);
  // Independent of the hero above: file = upload, null = "" clear sentinel, undefined = keep.
  if (cardIcon) {
    formData.append("card_icon", cardIcon);
  } else if (cardIcon === null) {
    formData.append("card_icon", "");
  }
  return formData;
}

export function createTreatment(data: CreateTreatmentInput, image?: File | null, cardIcon?: File | null) {
  return apiFetch<TreatmentResponse>("/api/treatments", {
    method: "POST",
    body: toTreatmentFormData(data, image, cardIcon),
  });
}

/** Image is optional on update — omit it to keep the existing stored image. */
export function updateTreatment(id: number, data: UpdateTreatmentInput, image?: File | null, cardIcon?: File | null) {
  return apiFetch<TreatmentResponse>(`/api/treatments/${id}`, {
    method: "PUT",
    body: toTreatmentFormData(data, image, cardIcon),
  });
}

/** Soft delete — sets status to "inactive" server-side; the stored image is intentionally preserved. */
export function deleteTreatment(id: number) {
  return apiFetch<DeleteTreatmentResponse>(`/api/treatments/${id}`, { method: "DELETE" });
}
