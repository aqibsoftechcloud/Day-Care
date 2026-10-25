export type GlobalTreatmentStatus = "active" | "inactive";

export type GlobalTreatmentLinkedSpeciality = {
  id: number;
  seo_url: string;
  speciality_name: string;
  speciality_title: string | null;
  status: "active" | "inactive";
};

/** Mirrors services/global-treatment.service.ts's select output — `linkedCityCount` is the live count of `treatments` rows pointing at this one via `global_treatment_id`. */
export type GlobalTreatment = {
  id: number;
  treatment_name: string;
  treatment_title: string | null;
  seo_url: string;
  short_description: string | null;
  description: string | null;
  image: string | null;
  /** Compact listing-card icon — independent of `image` (the detail hero). */
  card_icon: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keyword: string | null;
  global_speciality_id: number | null;
  global_specialities: GlobalTreatmentLinkedSpeciality | null;
  status: GlobalTreatmentStatus;
  created_at: string;
  updated_at: string;
  linkedCityCount: number;
};

export type ListGlobalTreatmentsFilter = {
  status?: GlobalTreatmentStatus;
};

/** Mirrors validators/global-treatment.validator.ts's createGlobalTreatmentSchema — `image` is handled separately as a multipart file. */
export type CreateGlobalTreatmentInput = {
  treatment_name: string;
  treatment_title?: string | null;
  seo_url: string;
  short_description?: string | null;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keyword?: string | null;
  /** Optional link to a `global_specialities` row — `null` explicitly clears an existing link, `undefined` leaves it unchanged. */
  global_speciality_id?: number | null;
  status?: GlobalTreatmentStatus;
};

export type UpdateGlobalTreatmentInput = Partial<CreateGlobalTreatmentInput>;
