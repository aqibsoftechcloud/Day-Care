import { apiFetch } from "./client";
import type {
  CreateGlobalTreatmentSectionInput,
  GlobalTreatmentSection,
  ReorderGlobalTreatmentSectionsInput,
  UpdateGlobalTreatmentSectionInput,
} from "@/types/global-treatment-section";

type GlobalTreatmentSectionsListResponse = { success: true; sections: GlobalTreatmentSection[] };
type GlobalTreatmentSectionResponse = { success: true; section: GlobalTreatmentSection };
type DeleteGlobalTreatmentSectionResponse = { success: true; message: string };
type UploadGlobalTreatmentSectionImageResponse = { success: true; path: string };

export function listGlobalTreatmentSections(globalTreatmentId: number) {
  return apiFetch<GlobalTreatmentSectionsListResponse>(`/api/global-treatments/${globalTreatmentId}/sections`);
}

export function createGlobalTreatmentSection(globalTreatmentId: number, data: CreateGlobalTreatmentSectionInput) {
  return apiFetch<GlobalTreatmentSectionResponse>(`/api/global-treatments/${globalTreatmentId}/sections`, {
    method: "POST",
    body: data,
  });
}

export function updateGlobalTreatmentSection(
  globalTreatmentId: number,
  sectionId: number,
  data: UpdateGlobalTreatmentSectionInput
) {
  return apiFetch<GlobalTreatmentSectionResponse>(`/api/global-treatments/${globalTreatmentId}/sections/${sectionId}`, {
    method: "PUT",
    body: data,
  });
}

export function deleteGlobalTreatmentSection(globalTreatmentId: number, sectionId: number) {
  return apiFetch<DeleteGlobalTreatmentSectionResponse>(`/api/global-treatments/${globalTreatmentId}/sections/${sectionId}`, {
    method: "DELETE",
  });
}

export function reorderGlobalTreatmentSections(globalTreatmentId: number, data: ReorderGlobalTreatmentSectionsInput) {
  return apiFetch<GlobalTreatmentSectionsListResponse>(`/api/global-treatments/${globalTreatmentId}/sections/reorder`, {
    method: "PUT",
    body: data,
  });
}

/** Uploads one section image and returns its stored path — call this first, then include the returned `path` in a section's `image` when saving. */
export function uploadGlobalTreatmentSectionImage(image: File) {
  const formData = new FormData();
  formData.append("image", image);
  return apiFetch<UploadGlobalTreatmentSectionImageResponse>("/api/global-treatments/section-image", {
    method: "POST",
    body: formData,
  });
}
