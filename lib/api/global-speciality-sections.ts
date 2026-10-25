import { apiFetch } from "./client";
import type {
  CreateGlobalSpecialitySectionInput,
  GlobalSpecialitySection,
  ReorderGlobalSpecialitySectionsInput,
  UpdateGlobalSpecialitySectionInput,
} from "@/types/global-speciality-section";

type GlobalSpecialitySectionsListResponse = { success: true; sections: GlobalSpecialitySection[] };
type GlobalSpecialitySectionResponse = { success: true; section: GlobalSpecialitySection };
type DeleteGlobalSpecialitySectionResponse = { success: true; message: string };
type UploadGlobalSpecialitySectionImageResponse = { success: true; path: string };

export function listGlobalSpecialitySections(globalSpecialityId: number) {
  return apiFetch<GlobalSpecialitySectionsListResponse>(`/api/global-specialities/${globalSpecialityId}/sections`);
}

export function createGlobalSpecialitySection(globalSpecialityId: number, data: CreateGlobalSpecialitySectionInput) {
  return apiFetch<GlobalSpecialitySectionResponse>(`/api/global-specialities/${globalSpecialityId}/sections`, {
    method: "POST",
    body: data,
  });
}

export function updateGlobalSpecialitySection(
  globalSpecialityId: number,
  sectionId: number,
  data: UpdateGlobalSpecialitySectionInput
) {
  return apiFetch<GlobalSpecialitySectionResponse>(`/api/global-specialities/${globalSpecialityId}/sections/${sectionId}`, {
    method: "PUT",
    body: data,
  });
}

export function deleteGlobalSpecialitySection(globalSpecialityId: number, sectionId: number) {
  return apiFetch<DeleteGlobalSpecialitySectionResponse>(`/api/global-specialities/${globalSpecialityId}/sections/${sectionId}`, {
    method: "DELETE",
  });
}

export function reorderGlobalSpecialitySections(globalSpecialityId: number, data: ReorderGlobalSpecialitySectionsInput) {
  return apiFetch<GlobalSpecialitySectionsListResponse>(`/api/global-specialities/${globalSpecialityId}/sections/reorder`, {
    method: "PUT",
    body: data,
  });
}

export function uploadGlobalSpecialitySectionImage(image: File) {
  const formData = new FormData();
  formData.append("image", image);
  return apiFetch<UploadGlobalSpecialitySectionImageResponse>("/api/global-specialities/section-image", {
    method: "POST",
    body: formData,
  });
}
