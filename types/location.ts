export type LocationStatus = "active" | "inactive";

/** Mirrors services/location.service.ts's plain row output — no select/omit, and no nested `city` object (only the raw `city_id` FK). */
export type Location = {
  id: number;
  city_id: number;
  area: string;
  zipcode: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  seo_url: string;
  status: LocationStatus;
  created_at: string;
  updated_at: string;
};

/** Mirrors validators/location.validator.ts's createLocationSchema. */
export type CreateLocationInput = {
  city_id: number;
  area: string;
  zipcode: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  seo_url: string;
  status?: LocationStatus;
};

export type UpdateLocationInput = Partial<CreateLocationInput>;
