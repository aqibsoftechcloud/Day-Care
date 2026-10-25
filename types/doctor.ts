export type DoctorStatus = "active" | "inactive";

/**
 * Mirrors services/doctor.service.ts's toSafeDoctor() output — embeds
 * `language`/`city`/`location` alongside the raw FK scalars (this service
 * DOES rename its Prisma relations to singular, unlike hospital.service.ts
 * — confirmed by reading it, not assumed).
 *
 * `schema_tags` is an untyped Prisma Json column — no shape is documented
 * anywhere in the backend (validator explicitly notes "the structure
 * itself is intentionally left opaque/untouched, per project convention")
 * so it's kept here only as `unknown` and is deliberately not editable
 * from the admin form, exactly like Hospital's `hospital_gallery`.
 */
export type Doctor = {
  id: number;
  language_id: number;
  doctor_name: string;
  meta_title: string | null;
  seo_url: string;
  meta_description: string | null;
  meta_keywords: string | null;
  qualification: string | null;
  experience: string | null;
  availability: string | null;
  city_id: number;
  location_id: number | null;
  patient_satisfaction_score: string | null;
  sorting_order: number;
  doctor_image: string | null;
  mon_sat_first_timings: string | null;
  mon_sat_second_timings: string | null;
  sunday_timings: string | null;
  time_interval: string | null;
  location_map: string | null;
  doctor_description: string | null;
  ai_content_generator: boolean;
  doc_info: string | null;
  schema_tags: unknown;
  latitude: string | null;
  longitude: string | null;
  status: DoctorStatus;
  created_at: string;
  updated_at: string;
  language: { id: number; name: string; seo_url: string };
  city: { id: number; city_name: string; seo_url: string };
  location: { id: number; area: string; zipcode: string; seo_url: string } | null;
};

/** Mirrors validators/doctor.validator.ts's listDoctorsQuerySchema — all real, server-supported filters. */
export type ListDoctorsFilter = {
  language_id?: number;
  city_id?: number;
  location_id?: number;
  status?: DoctorStatus;
};

/** Mirrors validators/doctor.validator.ts's createDoctorSchema — `doctor_image` and `schema_tags` are deliberately excluded (file upload / undocumented Json, respectively — see note above). */
export type CreateDoctorInput = {
  language_id: number;
  doctor_name: string;
  meta_title?: string | null;
  seo_url: string;
  meta_description?: string | null;
  meta_keywords?: string | null;
  qualification?: string | null;
  experience?: string | null;
  availability?: string | null;
  city_id: number;
  location_id?: number | null;
  patient_satisfaction_score?: number | string | null;
  sorting_order?: number;
  mon_sat_first_timings?: string | null;
  mon_sat_second_timings?: string | null;
  sunday_timings?: string | null;
  time_interval?: string | null;
  location_map?: string | null;
  doctor_description?: string | null;
  ai_content_generator?: boolean;
  doc_info?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  status?: DoctorStatus;
};

export type UpdateDoctorInput = Partial<CreateDoctorInput>;

/** Mirrors services/doctor-mapping.service.ts's getDoctorHospitals() output. */
export type DoctorMappedHospital = { id: number; hospital_name: string; seo_url: string };

/** Mirrors services/doctor-mapping.service.ts's getDoctorSpecialityMappings() output. */
export type DoctorMappedSpeciality = { id: number; speciality_name: string; seo_url: string };
