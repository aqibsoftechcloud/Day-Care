import { apiFetch } from "./client";
import type {
  CreateHospitalSectionInput,
  HospitalSection,
  ReorderHospitalSectionsInput,
  UpdateHospitalSectionInput,
} from "@/types/hospital-section";

type HospitalSectionsListResponse = { success: true; sections: HospitalSection[] };
type HospitalSectionResponse = { success: true; section: HospitalSection };
type DeleteHospitalSectionResponse = { success: true; message: string };
type UploadHospitalSectionImageResponse = { success: true; path: string };

/** Also auto-provisions the 5 predefined sections server-side the first time this hospital is read — see services/hospital-section.service.ts's getOrCreateHospitalSections. */
export function listHospitalSections(hospitalId: number) {
  return apiFetch<HospitalSectionsListResponse>(`/api/hospitals/${hospitalId}/sections`);
}

/** Always creates a `section_type: "custom"` section — see types/hospital-section.ts. */
export function createHospitalSection(hospitalId: number, data: CreateHospitalSectionInput) {
  return apiFetch<HospitalSectionResponse>(`/api/hospitals/${hospitalId}/sections`, {
    method: "POST",
    body: data,
  });
}

export function updateHospitalSection(hospitalId: number, sectionId: number, data: UpdateHospitalSectionInput) {
  return apiFetch<HospitalSectionResponse>(`/api/hospitals/${hospitalId}/sections/${sectionId}`, {
    method: "PUT",
    body: data,
  });
}

/** Only a `custom` section can be deleted — a fixed/system section is refused (400) server-side. */
export function deleteHospitalSection(hospitalId: number, sectionId: number) {
  return apiFetch<DeleteHospitalSectionResponse>(`/api/hospitals/${hospitalId}/sections/${sectionId}`, {
    method: "DELETE",
  });
}

export function reorderHospitalSections(hospitalId: number, data: ReorderHospitalSectionsInput) {
  return apiFetch<HospitalSectionsListResponse>(`/api/hospitals/${hospitalId}/sections/reorder`, {
    method: "PUT",
    body: data,
  });
}

/** Uploads one custom-section image and returns its stored path — call this first, then include the returned `path` in a section's `content` when saving. */
export function uploadHospitalSectionImage(image: File) {
  const formData = new FormData();
  formData.append("image", image);
  return apiFetch<UploadHospitalSectionImageResponse>("/api/hospitals/section-image", {
    method: "POST",
    body: formData,
  });
}
