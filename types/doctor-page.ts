export type DoctorPageStatus = "active" | "inactive";

/** Mirrors services/doctor-page.service.ts's toSafeDoctorPage() output — embeds `city`/`location`/`speciality` alongside the raw FK scalars. No relation to a `doctors` record exists on this model. */
export type DoctorPage = {
  id: number;
  pagename: string;
  keyword: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  seo_url: string;
  city_id: number;
  location_id: number | null;
  speciality_id: number;
  description: string | null;
  status: DoctorPageStatus;
  created_at: string;
  updated_at: string;
  city: { id: number; city_name: string };
  location: { id: number; area: string; zipcode: string } | null;
  speciality: { id: number; speciality_name: string; speciality_title: string | null; seo_url: string };
};

/** Mirrors validators/doctor-page.validator.ts's createDoctorPageSchema. */
export type CreateDoctorPageInput = {
  pagename: string;
  keyword?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  seo_url: string;
  city_id: number;
  location_id?: number | null;
  speciality_id: number;
  description?: string | null;
  status?: DoctorPageStatus;
};

export type UpdateDoctorPageInput = Partial<CreateDoctorPageInput>;
