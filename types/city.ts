export type CityStatus = "active" | "inactive";

/** Mirrors services/city.service.ts's plain row output — no select/omit, and no nested `language` object (only the raw `language_id` FK). */
export type City = {
  id: number;
  language_id: number;
  city_name: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  seo_url: string;
  status: CityStatus;
  created_at: string;
  updated_at: string;
};

/** Mirrors validators/city.validator.ts's createCitySchema. */
export type CreateCityInput = {
  language_id: number;
  city_name: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  seo_url: string;
  status?: CityStatus;
};

export type UpdateCityInput = Partial<CreateCityInput>;
