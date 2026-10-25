import { apiFetch } from "./client";
import type {
  CreateSpecialityInput,
  ListSpecialitiesFilter,
  Speciality,
  UpdateSpecialityInput,
} from "@/types/speciality";

type SpecialitiesListResponse = { success: true; specialities: Speciality[] };
type SpecialityResponse = { success: true; speciality: Speciality };
type DeleteSpecialityResponse = { success: true; message: string };

function toQueryString(filter?: ListSpecialitiesFilter): string {
  if (!filter) return "";
  const params = new URLSearchParams();
  if (filter.city_id !== undefined) params.set("city_id", String(filter.city_id));
  if (filter.location_id !== undefined) params.set("location_id", String(filter.location_id));
  if (filter.hospital_id !== undefined) params.set("hospital_id", String(filter.hospital_id));
  if (filter.parent_speciality_id !== undefined) params.set("parent_speciality_id", String(filter.parent_speciality_id));
  if (filter.status !== undefined) params.set("status", filter.status);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** `filter` is optional and defaults to the full list — Doctor Pages' Speciality lookup relies on the no-arg call continuing to work unchanged. */
export function listSpecialities(filter?: ListSpecialitiesFilter) {
  return apiFetch<SpecialitiesListResponse>(`/api/specialities${toQueryString(filter)}`);
}

export function getSpeciality(id: number) {
  return apiFetch<SpecialityResponse>(`/api/specialities/${id}`);
}

/**
 * Builds the multipart body the actual controller expects
 * (parseMultipartFields) — speciality_logo is a real file, never JSON.
 * Mirrors lib/api/doctors.ts's toDoctorFormData() exactly, including its
 * "only append when truthy" limitation for plain optional text fields
 * (an existing, accepted trade-off of this project's multipart admin
 * forms — see that file for the full rationale).
 *
 * `location_id`/`hospital_id`/`parent_speciality_id`/`doctor_speciality_id`
 * are the one exception: they're always appended (using "" for `null`,
 * which the validator's `nullableIdFromFormSchema` reads back as an
 * explicit clear), because the form's own dropdowns always resolve to a
 * definite value (a real id or "None") on every submit — omitting them
 * here would silently break clearing them back to "None".
 */
function toSpecialityFormData(
  data: CreateSpecialityInput | UpdateSpecialityInput,
  image?: File | null,
  cardIcon?: File | null
): FormData {
  const formData = new FormData();
  if (data.speciality_name !== undefined) formData.append("speciality_name", data.speciality_name);
  if (data.speciality_title) formData.append("speciality_title", data.speciality_title);
  if (data.seo_url !== undefined) formData.append("seo_url", data.seo_url);
  if (data.meta_title) formData.append("meta_title", data.meta_title);
  if (data.meta_description) formData.append("meta_description", data.meta_description);
  if (data.meta_keyword) formData.append("meta_keyword", data.meta_keyword);
  if (data.city_id !== undefined) formData.append("city_id", String(data.city_id));
  if (data.location_id !== undefined) {
    formData.append("location_id", data.location_id === null ? "" : String(data.location_id));
  }
  if (data.hospital_id !== undefined) {
    formData.append("hospital_id", data.hospital_id === null ? "" : String(data.hospital_id));
  }
  if (data.short_description) formData.append("short_description", data.short_description);
  if (data.parent_speciality_id !== undefined) {
    formData.append("parent_speciality_id", data.parent_speciality_id === null ? "" : String(data.parent_speciality_id));
  }
  if (data.doctor_speciality_id !== undefined) {
    formData.append("doctor_speciality_id", data.doctor_speciality_id === null ? "" : String(data.doctor_speciality_id));
  }
  if (data.global_speciality_id !== undefined) {
    formData.append("global_speciality_id", data.global_speciality_id === null ? "" : String(data.global_speciality_id));
  }
  if (data.keywords_for_doctors) formData.append("keywords_for_doctors", data.keywords_for_doctors);
  if (data.status) formData.append("status", data.status);
  if (data.ai_content_generator !== undefined) {
    formData.append("ai_content_generator", String(data.ai_content_generator));
  }
  if (data.description) formData.append("description", data.description);
  if (image) {
    formData.append("speciality_logo", image);
  } else if (image === null) {
    // Explicit clear sentinel the controller's resolveImageInput() checks for.
    formData.append("speciality_logo", "");
  }

  if (cardIcon) {
    formData.append("card_icon", cardIcon);
  } else if (cardIcon === null) {
    formData.append("card_icon", "");
  }
  return formData;
}

export function createSpeciality(data: CreateSpecialityInput, image?: File | null, cardIcon?: File | null) {
  return apiFetch<SpecialityResponse>("/api/specialities", {
    method: "POST",
    body: toSpecialityFormData(data, image, cardIcon),
  });
}

/** Logo is optional on update — omit it to keep the existing stored logo, or pass `null` to remove it entirely. */
export function updateSpeciality(id: number, data: UpdateSpecialityInput, image?: File | null, cardIcon?: File | null) {
  return apiFetch<SpecialityResponse>(`/api/specialities/${id}`, {
    method: "PUT",
    body: toSpecialityFormData(data, image, cardIcon),
  });
}

/**
 * Soft delete — sets status to "inactive" server-side. The backend refuses
 * to deactivate a speciality that still has active child specialities
 * (SpecialityHasActiveChildrenError, HTTP 409) — surfaced verbatim via the
 * existing ApiError message, not handled specially here.
 */
export function deleteSpeciality(id: number) {
  return apiFetch<DeleteSpecialityResponse>(`/api/specialities/${id}`, { method: "DELETE" });
}
