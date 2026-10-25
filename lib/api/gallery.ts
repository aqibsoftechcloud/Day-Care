import { apiFetch } from "./client";
import type {
  CreateGalleryInput,
  Gallery,
  ListGalleryFilter,
  UpdateGalleryInput,
} from "@/types/gallery";

// Response key names mirror the backend exactly: the list handler returns
// `gallery` (the array), while get/create/update return `galleryItem`
// (a single record) — confirmed by reading controllers/gallery.controller.ts.
type GalleryListResponse = { success: true; gallery: Gallery[] };
type GalleryItemResponse = { success: true; galleryItem: Gallery };
type DeleteGalleryResponse = { success: true; message: string };

function toQueryString(filter?: ListGalleryFilter): string {
  if (!filter) return "";
  const params = new URLSearchParams();
  if (filter.gallery_type !== undefined) params.set("gallery_type", filter.gallery_type);
  if (filter.gallery_status !== undefined) params.set("gallery_status", filter.gallery_status);
  if (filter.hospital_id !== undefined) params.set("hospital_id", String(filter.hospital_id));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Builds the multipart body the actual controller expects (parseMultipartFields) — `image` is an optional real file. */
function toGalleryFormData(data: CreateGalleryInput | UpdateGalleryInput, image?: File | null): FormData {
  const formData = new FormData();
  if (data.hospital_id !== undefined && data.hospital_id !== null) {
    formData.append("hospital_id", String(data.hospital_id));
  }
  if (data.gallery_name !== undefined) formData.append("gallery_name", data.gallery_name);
  if (data.meta_title) formData.append("meta_title", data.meta_title);
  if (data.meta_keyword) formData.append("meta_keyword", data.meta_keyword);
  if (data.meta_description) formData.append("meta_description", data.meta_description);
  if (data.gallery_type !== undefined) formData.append("gallery_type", data.gallery_type);
  if (data.gallery_status !== undefined) formData.append("gallery_status", data.gallery_status);
  if (data.seo_url !== undefined) formData.append("seo_url", data.seo_url);
  if (data.source) formData.append("source", data.source);
  if (data.sorting_order !== undefined) formData.append("sorting_order", String(data.sorting_order));
  if (image) formData.append("image", image);
  return formData;
}

export function listGallery(filter?: ListGalleryFilter) {
  return apiFetch<GalleryListResponse>(`/api/gallery${toQueryString(filter)}`);
}

export function getGalleryItem(id: number) {
  return apiFetch<GalleryItemResponse>(`/api/gallery/${id}`);
}

export function createGalleryItem(data: CreateGalleryInput, image?: File | null) {
  return apiFetch<GalleryItemResponse>("/api/gallery", { method: "POST", body: toGalleryFormData(data, image) });
}

/** Image is optional on update — omit it to keep the existing stored source. */
export function updateGalleryItem(id: number, data: UpdateGalleryInput, image?: File | null) {
  return apiFetch<GalleryItemResponse>(`/api/gallery/${id}`, { method: "PUT", body: toGalleryFormData(data, image) });
}

/** Soft delete — sets gallery_status to "inactive" (note: not `status`). */
export function deleteGalleryItem(id: number) {
  return apiFetch<DeleteGalleryResponse>(`/api/gallery/${id}`, { method: "DELETE" });
}
