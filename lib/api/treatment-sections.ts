import { apiFetch } from "./client";
import type {
  CreateTreatmentSectionInput,
  ReorderTreatmentSectionsInput,
  TreatmentSection,
  UpdateTreatmentSectionInput,
} from "@/types/treatment-section";

type TreatmentSectionsListResponse = { success: true; sections: TreatmentSection[] };
type TreatmentSectionResponse = { success: true; section: TreatmentSection };
type DeleteTreatmentSectionResponse = { success: true; message: string };
type UploadTreatmentSectionImageResponse = { success: true; path: string };

/** Also auto-provisions the 15 predefined sections server-side the first time this treatment is read — see services/treatment-section.service.ts's getOrCreateTreatmentSections. */
export function listTreatmentSections(treatmentId: number) {
  return apiFetch<TreatmentSectionsListResponse>(`/api/treatments/${treatmentId}/sections`);
}

/** Always creates a `section_type: "custom"` section — see types/treatment-section.ts. */
export function createTreatmentSection(treatmentId: number, data: CreateTreatmentSectionInput) {
  return apiFetch<TreatmentSectionResponse>(`/api/treatments/${treatmentId}/sections`, {
    method: "POST",
    body: data,
  });
}

export function updateTreatmentSection(treatmentId: number, sectionId: number, data: UpdateTreatmentSectionInput) {
  return apiFetch<TreatmentSectionResponse>(`/api/treatments/${treatmentId}/sections/${sectionId}`, {
    method: "PUT",
    body: data,
  });
}

/** Only a `custom` section can be deleted — a fixed/system section is refused (400) server-side. */
export function deleteTreatmentSection(treatmentId: number, sectionId: number) {
  return apiFetch<DeleteTreatmentSectionResponse>(`/api/treatments/${treatmentId}/sections/${sectionId}`, {
    method: "DELETE",
  });
}

export function reorderTreatmentSections(treatmentId: number, data: ReorderTreatmentSectionsInput) {
  return apiFetch<TreatmentSectionsListResponse>(`/api/treatments/${treatmentId}/sections/reorder`, {
    method: "PUT",
    body: data,
  });
}

/** Uploads one custom-section image and returns its stored path — call this first, then include the returned `path` in a section's `content` when saving. */
export function uploadTreatmentSectionImage(image: File) {
  const formData = new FormData();
  formData.append("image", image);
  return apiFetch<UploadTreatmentSectionImageResponse>("/api/treatments/section-image", {
    method: "POST",
    body: formData,
  });
}
