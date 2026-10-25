import { apiFetch } from "./client";
import type {
  CreateGlobalSpecialityInput,
  GlobalSpeciality,
  GlobalSpecialityNavigationPlacement,
  ListGlobalSpecialitiesFilter,
  SetGlobalSpecialityNavigationInput,
  UpdateGlobalSpecialityInput,
} from "@/types/global-speciality";

type GlobalSpecialitiesListResponse = { success: true; globalSpecialities: GlobalSpeciality[] };
type GlobalSpecialityResponse = { success: true; globalSpeciality: GlobalSpeciality };
type DeleteGlobalSpecialityResponse = { success: true; message: string };
type GlobalSpecialityNavigationResponse = { success: true; placement: GlobalSpecialityNavigationPlacement };

function toQueryString(filter?: ListGlobalSpecialitiesFilter): string {
  if (!filter) return "";
  const params = new URLSearchParams();
  if (filter.status !== undefined) params.set("status", filter.status);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listGlobalSpecialities(filter?: ListGlobalSpecialitiesFilter) {
  return apiFetch<GlobalSpecialitiesListResponse>(`/api/global-specialities${toQueryString(filter)}`);
}

export function getGlobalSpeciality(id: number) {
  return apiFetch<GlobalSpecialityResponse>(`/api/global-specialities/${id}`);
}

/** Builds the multipart body the actual controller expects — `image` is a real file, never JSON. No city/hospital/location/doctor-speciality fields — a global speciality is city-independent by design. */
function toGlobalSpecialityFormData(data: CreateGlobalSpecialityInput | UpdateGlobalSpecialityInput, image?: File | null, cardIcon?: File | null): FormData {
  const formData = new FormData();
  if (data.speciality_name !== undefined) formData.append("speciality_name", data.speciality_name);
  if (data.speciality_title) formData.append("speciality_title", data.speciality_title);
  if (data.seo_url !== undefined) formData.append("seo_url", data.seo_url);
  if (data.short_description) formData.append("short_description", data.short_description);
  if (data.description) formData.append("description", data.description);
  if (data.meta_title) formData.append("meta_title", data.meta_title);
  if (data.meta_description) formData.append("meta_description", data.meta_description);
  if (data.meta_keyword) formData.append("meta_keyword", data.meta_keyword);
  if (data.status) formData.append("status", data.status);
  if (image) {
    formData.append("image", image);
  } else if (image === null) {
    // Explicit clear sentinel the controller's resolveImageInput() checks for.
    formData.append("image", "");
  }

  if (cardIcon) {
    formData.append("card_icon", cardIcon);
  } else if (cardIcon === null) {
    formData.append("card_icon", "");
  }
  return formData;
}

export function createGlobalSpeciality(data: CreateGlobalSpecialityInput, image?: File | null, cardIcon?: File | null) {
  return apiFetch<GlobalSpecialityResponse>("/api/global-specialities", {
    method: "POST",
    body: toGlobalSpecialityFormData(data, image, cardIcon),
  });
}

export function updateGlobalSpeciality(id: number, data: UpdateGlobalSpecialityInput, image?: File | null, cardIcon?: File | null) {
  return apiFetch<GlobalSpecialityResponse>(`/api/global-specialities/${id}`, {
    method: "PUT",
    body: toGlobalSpecialityFormData(data, image, cardIcon),
  });
}

export function deleteGlobalSpeciality(id: number) {
  return apiFetch<DeleteGlobalSpecialityResponse>(`/api/global-specialities/${id}`, { method: "DELETE" });
}

/** The Navigation tab's current configuration — `placement: null` means "not shown in navigation yet". */
export function getGlobalSpecialityNavigation(id: number) {
  return apiFetch<GlobalSpecialityNavigationResponse>(`/api/global-specialities/${id}/navigation`);
}

export function setGlobalSpecialityNavigation(id: number, data: SetGlobalSpecialityNavigationInput) {
  return apiFetch<GlobalSpecialityNavigationResponse>(`/api/global-specialities/${id}/navigation`, {
    method: "PUT",
    body: data,
  });
}
