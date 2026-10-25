import { apiFetch } from "./client";
import type { Banner, CreateBannerInput, UpdateBannerInput } from "@/types/banner";

type BannersListResponse = { success: true; banners: Banner[] };
type BannerResponse = { success: true; banner: Banner };
type DeleteBannerResponse = { success: true; message: string };

type BannerFiles = {
  banner_image?: File | null;
  mobile_banner_image?: File | null;
};

/** No pagination/search/filter query params exist on this endpoint — always returns the full list, sorted server-side by sorting_order. */
export function listBanners() {
  return apiFetch<BannersListResponse>("/api/banners");
}

export function getBanner(id: number) {
  return apiFetch<BannerResponse>(`/api/banners/${id}`);
}

/** Builds the multipart body the actual controller expects (parseMultipartFields) — banner_image/mobile_banner_image are real files, never JSON. */
function toBannerFormData(data: CreateBannerInput | UpdateBannerInput, files?: BannerFiles): FormData {
  const formData = new FormData();
  if (data.banner_name !== undefined) formData.append("banner_name", data.banner_name);
  if (data.banner_url) formData.append("banner_url", data.banner_url);
  if (data.city_id !== undefined) formData.append("city_id", String(data.city_id));
  if (data.sorting_order !== undefined) formData.append("sorting_order", String(data.sorting_order));
  if (data.status) formData.append("status", data.status);
  if (files?.banner_image) formData.append("banner_image", files.banner_image);
  if (files?.mobile_banner_image) formData.append("mobile_banner_image", files.mobile_banner_image);
  return formData;
}

/** `banner_image` is required by the backend on create (throws BannerImageRequiredError otherwise). */
export function createBanner(data: CreateBannerInput, files: { banner_image: File; mobile_banner_image?: File | null }) {
  return apiFetch<BannerResponse>("/api/banners", {
    method: "POST",
    body: toBannerFormData(data, files),
  });
}

/** Image files are optional on update — omit them to keep the existing stored image. */
export function updateBanner(id: number, data: UpdateBannerInput, files?: BannerFiles) {
  return apiFetch<BannerResponse>(`/api/banners/${id}`, {
    method: "PUT",
    body: toBannerFormData(data, files),
  });
}

/** Soft delete — sets status to "inactive" server-side; stored image files are intentionally preserved. */
export function deleteBanner(id: number) {
  return apiFetch<DeleteBannerResponse>(`/api/banners/${id}`, { method: "DELETE" });
}
