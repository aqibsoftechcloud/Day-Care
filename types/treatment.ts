export type TreatmentStatus = "active" | "inactive";

/** Mirrors services/treatment.service.ts's toSafeTreatment() output — embeds `speciality`/`language`/`city`/`location`/`hospital` alongside the raw FK scalars. */
export type Treatment = {
  id: number;
  speciality_id: number;
  sub_speciality_name: string;
  sub_speciality_title: string | null;
  seo_url: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keyword: string | null;
  language_id: number;
  city_id: number;
  location_id: number | null;
  hospital_id: number | null;
  speciality_logo: string | null;
  /** Compact listing-card icon — independent of `speciality_logo` (the detail hero). */
  card_icon: string | null;
  short_description: string | null;
  keywords_for_doctors: string | null;
  status: TreatmentStatus;
  ai_content_generator: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
  speciality: { id: number; speciality_name: string; speciality_title: string | null; seo_url: string };
  language: { id: number; name: string; seo_url: string };
  city: { id: number; city_name: string; seo_url: string };
  location: { id: number; area: string; zipcode: string; seo_url: string } | null;
  hospital: { id: number; hospital_name: string; seo_url: string } | null;
  /** Optional link to this treatment's city-independent "global" concept (`global_treatments`) — a discovery pointer only, never a content source. */
  global_treatment_id: number | null;
};

/** Mirrors validators/treatment.validator.ts's listTreatmentsQuerySchema — all real, server-supported filters. */
export type ListTreatmentsFilter = {
  speciality_id?: number;
  language_id?: number;
  city_id?: number;
  location_id?: number;
  hospital_id?: number;
  status?: TreatmentStatus;
};

/** Mirrors validators/treatment.validator.ts's createTreatmentSchema — `speciality_logo` is deliberately excluded (handled as a multipart file, not JSON/form text). */
export type CreateTreatmentInput = {
  speciality_id: number;
  sub_speciality_name: string;
  sub_speciality_title?: string | null;
  seo_url: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keyword?: string | null;
  language_id: number;
  city_id: number;
  location_id?: number | null;
  hospital_id?: number | null;
  short_description?: string | null;
  global_treatment_id?: number | null;
  keywords_for_doctors?: string | null;
  status?: TreatmentStatus;
  ai_content_generator?: boolean;
  description?: string | null;
};

export type UpdateTreatmentInput = Partial<CreateTreatmentInput>;
