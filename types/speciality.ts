export type SpecialityStatus = "active" | "inactive";

/** Mirrors services/speciality.service.ts's toSafeSpeciality() output — embeds `city`/`location`/`hospital`/`parent` alongside the raw FK scalars. */
export type Speciality = {
  id: number;
  speciality_name: string;
  speciality_title: string | null;
  seo_url: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keyword: string | null;
  city_id: number;
  location_id: number | null;
  hospital_id: number | null;
  speciality_logo: string | null;
  card_icon: string | null;
  short_description: string | null;
  parent_speciality_id: number | null;
  keywords_for_doctors: string | null;
  status: SpecialityStatus;
  ai_content_generator: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
  city: { id: number; city_name: string };
  location: { id: number; area: string; zipcode: string } | null;
  hospital: { id: number; hospital_name: string; seo_url: string } | null;
  parent: { id: number; speciality_name: string; speciality_title: string | null; seo_url: string } | null;
  /** Links to the nationwide `doctor_specialities` taxonomy (never `doctors.id` directly) — the public Speciality Doctors section's source for "which doctors work in this speciality" via `doctor_speciality_mappings`. */
  doctor_speciality_id: number | null;
  doctorSpeciality: { id: number; speciality_name: string; seo_url: string } | null;
  /** Optional link to this speciality's city-independent "global" concept (`global_specialities`) — a discovery pointer only, never a content source. */
  global_speciality_id: number | null;
};

/** Mirrors validators/speciality.validator.ts's listSpecialitiesQuerySchema — all real, server-supported filters. */
export type ListSpecialitiesFilter = {
  city_id?: number;
  location_id?: number;
  hospital_id?: number;
  parent_speciality_id?: number;
  status?: SpecialityStatus;
};

/** Mirrors validators/speciality.validator.ts's createSpecialitySchema — `speciality_logo` is deliberately excluded (it's an uploaded image now, sent as a separate `File` alongside this JSON-shaped data; see lib/api/specialities.ts). */
export type CreateSpecialityInput = {
  speciality_name: string;
  speciality_title?: string | null;
  seo_url: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keyword?: string | null;
  city_id: number;
  location_id?: number | null;
  hospital_id?: number | null;
  short_description?: string | null;
  parent_speciality_id?: number | null;
  doctor_speciality_id?: number | null;
  global_speciality_id?: number | null;
  keywords_for_doctors?: string | null;
  status?: SpecialityStatus;
  ai_content_generator?: boolean;
  description?: string | null;
};

export type UpdateSpecialityInput = Partial<CreateSpecialityInput>;
