import { apiFetch } from "./client";
import type {
  CreateSpecialitySectionInput,
  ReorderSpecialitySectionsInput,
  SpecialitySection,
  UpdateSpecialitySectionInput,
} from "@/types/speciality-section";

type SpecialitySectionsListResponse = { success: true; sections: SpecialitySection[] };
type SpecialitySectionResponse = { success: true; section: SpecialitySection };
type DeleteSpecialitySectionResponse = { success: true; message: string };
type UploadSpecialitySectionImageResponse = { success: true; path: string };

/** Also auto-provisions the 8 predefined sections server-side the first time this speciality is read — see services/speciality-section.service.ts's getOrCreateSpecialitySections. */
export function listSpecialitySections(specialityId: number) {
  return apiFetch<SpecialitySectionsListResponse>(`/api/specialities/${specialityId}/sections`);
}

/** Always creates a `section_type: "custom"` section — see types/speciality-section.ts. */
export function createSpecialitySection(specialityId: number, data: CreateSpecialitySectionInput) {
  return apiFetch<SpecialitySectionResponse>(`/api/specialities/${specialityId}/sections`, {
    method: "POST",
    body: data,
  });
}

export function updateSpecialitySection(specialityId: number, sectionId: number, data: UpdateSpecialitySectionInput) {
  return apiFetch<SpecialitySectionResponse>(`/api/specialities/${specialityId}/sections/${sectionId}`, {
    method: "PUT",
    body: data,
  });
}

/** Only a `custom` section can be deleted — a fixed/system section is refused (400) server-side. */
export function deleteSpecialitySection(specialityId: number, sectionId: number) {
  return apiFetch<DeleteSpecialitySectionResponse>(`/api/specialities/${specialityId}/sections/${sectionId}`, {
    method: "DELETE",
  });
}

export function reorderSpecialitySections(specialityId: number, data: ReorderSpecialitySectionsInput) {
  return apiFetch<SpecialitySectionsListResponse>(`/api/specialities/${specialityId}/sections/reorder`, {
    method: "PUT",
    body: data,
  });
}

/** Uploads one custom-section image and returns its stored path — call this first, then include the returned `path` in a section's `content` when saving. */
export function uploadSpecialitySectionImage(image: File) {
  const formData = new FormData();
  formData.append("image", image);
  return apiFetch<UploadSpecialitySectionImageResponse>("/api/specialities/section-image", {
    method: "POST",
    body: formData,
  });
}
