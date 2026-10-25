import { apiFetch } from "./client";
import type {
  CreateNewsMediaInput,
  ListNewsMediaFilter,
  NewsMedia,
  UpdateNewsMediaInput,
} from "@/types/news-media";

// Response key names mirror the backend exactly: the list handler returns
// `newsMedia` (the array), while get/create/update return `newsMediaItem`
// (a single record) — confirmed by reading controllers/news-media.controller.ts.
type NewsMediaListResponse = { success: true; newsMedia: NewsMedia[] };
type NewsMediaItemResponse = { success: true; newsMediaItem: NewsMedia };
type DeleteNewsMediaResponse = { success: true; message: string };

function toQueryString(filter?: ListNewsMediaFilter): string {
  if (!filter?.status) return "";
  return `?status=${filter.status}`;
}

export function listNewsMedia(filter?: ListNewsMediaFilter) {
  return apiFetch<NewsMediaListResponse>(`/api/news-media${toQueryString(filter)}`);
}

export function getNewsMediaItem(id: number) {
  return apiFetch<NewsMediaItemResponse>(`/api/news-media/${id}`);
}

/** Builds the multipart body the actual controller expects (parseMultipartFields) — view_image is a real file, view_link is a plain string field despite the name. */
function toNewsMediaFormData(data: CreateNewsMediaInput | UpdateNewsMediaInput, image?: File | null): FormData {
  const formData = new FormData();
  if (data.title !== undefined) formData.append("title", data.title);
  if (data.location) formData.append("location", data.location);
  if (data.date) formData.append("date", data.date);
  if (data.view_link) formData.append("view_link", data.view_link);
  if (data.status) formData.append("status", data.status);
  if (image) formData.append("view_image", image);
  return formData;
}

export function createNewsMediaItem(data: CreateNewsMediaInput, image?: File | null) {
  return apiFetch<NewsMediaItemResponse>("/api/news-media", {
    method: "POST",
    body: toNewsMediaFormData(data, image),
  });
}

/** Image is optional on update — omit it to keep the existing stored image. */
export function updateNewsMediaItem(id: number, data: UpdateNewsMediaInput, image?: File | null) {
  return apiFetch<NewsMediaItemResponse>(`/api/news-media/${id}`, {
    method: "PUT",
    body: toNewsMediaFormData(data, image),
  });
}

/** Soft delete — sets status to "inactive" server-side; content and the stored image are intentionally preserved. */
export function deleteNewsMediaItem(id: number) {
  return apiFetch<DeleteNewsMediaResponse>(`/api/news-media/${id}`, { method: "DELETE" });
}
