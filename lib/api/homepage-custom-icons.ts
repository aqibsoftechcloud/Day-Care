import { apiFetch, ApiError } from "./client";
import type { HomepageCustomIcon } from "@/types/homepage-custom-icon";

type CustomIconsListResponse = { success: true; customIcons: HomepageCustomIcon[] };
type CustomIconResponse = { success: true; customIcon: HomepageCustomIcon };
type DeleteCustomIconResponse = { success: true; message: string };

export function listHomepageCustomIcons() {
  return apiFetch<CustomIconsListResponse>("/api/homepage-icon-settings/custom-icons");
}

export function deleteHomepageCustomIcon(id: number) {
  return apiFetch<DeleteCustomIconResponse>(`/api/homepage-icon-settings/custom-icons/${id}`, { method: "DELETE" });
}

type BackendErrorShape = { success?: boolean; message?: string; errors?: Record<string, string[]> };

/**
 * Real upload-progress reporting (`onProgress`, 0–100) needs
 * `XMLHttpRequest`'s `upload.onprogress` — `fetch()` (what `apiFetch`
 * uses for every other request) has no equivalent for a request body in
 * standard browsers, so this is the one API client function in the
 * project that doesn't go through `apiFetch`. Everything else about it
 * (credentials, the backend's `{success, message, errors}` shape,
 * throwing a typed `ApiError`) mirrors `apiFetch` exactly, so callers
 * can treat failures identically either way.
 */
export function uploadHomepageCustomIcon(file: File, onProgress?: (percent: number) => void): Promise<CustomIconResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.open("POST", "/api/homepage-icon-settings/custom-icons");
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onerror = () => {
      reject(new ApiError(0, "Unable to reach the server. Check your connection and try again."));
    };

    xhr.onload = () => {
      let data: BackendErrorShape & Partial<CustomIconResponse> = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // No/invalid JSON body — proceed with data = {}.
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data as CustomIconResponse);
        return;
      }

      reject(new ApiError(xhr.status, data.message || "Upload failed.", data.errors));
    };

    xhr.send(formData);
  });
}
