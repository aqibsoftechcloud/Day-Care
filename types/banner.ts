export type BannerStatus = "active" | "inactive";

/** Mirrors services/banner.service.ts's plain row output — no nested `city` object, only the raw `city_id` FK. Image fields are storage paths/URLs, not embedded files. */
export type Banner = {
  id: number;
  banner_name: string;
  banner_url: string | null;
  banner_image: string;
  mobile_banner_image: string | null;
  city_id: number;
  sorting_order: number;
  status: BannerStatus;
  created_at: string;
  updated_at: string;
};

/** Mirrors validators/banner.validator.ts's createBannerSchema — image fields are deliberately excluded (handled as multipart files, not JSON). */
export type CreateBannerInput = {
  banner_name: string;
  banner_url?: string | null;
  city_id: number;
  sorting_order?: number;
  status?: BannerStatus;
};

export type UpdateBannerInput = Partial<CreateBannerInput>;
