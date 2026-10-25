import { apiFetch } from "./client";
import type {
  CreatePageSectionInput,
  PageSection,
  ReorderPageSectionsInput,
  UpdatePageSectionInput,
} from "@/types/page-section";

type PageSectionsListResponse = { success: true; sections: PageSection[] };
type PageSectionResponse = { success: true; section: PageSection };
type DeletePageSectionResponse = { success: true; message: string };
type UploadPageSectionImageResponse = { success: true; path: string };

export function listPageSections(pageId: number) {
  return apiFetch<PageSectionsListResponse>(`/api/pages/${pageId}/sections`);
}

export function createPageSection(pageId: number, data: CreatePageSectionInput) {
  return apiFetch<PageSectionResponse>(`/api/pages/${pageId}/sections`, { method: "POST", body: data });
}

export function updatePageSection(pageId: number, sectionId: number, data: UpdatePageSectionInput) {
  return apiFetch<PageSectionResponse>(`/api/pages/${pageId}/sections/${sectionId}`, { method: "PUT", body: data });
}

export function deletePageSection(pageId: number, sectionId: number) {
  return apiFetch<DeletePageSectionResponse>(`/api/pages/${pageId}/sections/${sectionId}`, { method: "DELETE" });
}

export function duplicatePageSection(pageId: number, sectionId: number) {
  return apiFetch<PageSectionResponse>(`/api/pages/${pageId}/sections/${sectionId}/duplicate`, { method: "POST" });
}

export function reorderPageSections(pageId: number, data: ReorderPageSectionsInput) {
  return apiFetch<PageSectionsListResponse>(`/api/pages/${pageId}/sections/reorder`, { method: "PUT", body: data });
}

/** Uploads one section image and returns its stored path — call this first, then include the returned `path` in a section's `content` when saving. */
export function uploadPageSectionImage(image: File) {
  const formData = new FormData();
  formData.append("image", image);
  return apiFetch<UploadPageSectionImageResponse>("/api/pages/section-image", { method: "POST", body: formData });
}
