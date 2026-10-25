export type HospitalStatus = "active" | "inactive";

/**
 * Mirrors services/hospital.service.ts's hospitalSelect output exactly.
 * Unlike Speciality/Treatment, this service has no `toSafeX()` mapper —
 * it returns Prisma's raw relation names verbatim, so the nested objects
 * are `cities`/`locations` (plural), not `city`/`location`. Don't
 * "correct" this to match the other modules; it would stop matching the
 * actual API response.
 *
 * `hospital_gallery` is an untyped Prisma Json column — no shape is
 * documented anywhere in the backend (validator accepts `z.unknown()`,
 * every example payload in the Postman collection sends `null`) — so it's
 * kept here only as `unknown` and is deliberately not editable from the
 * admin form; the API contract for it is undefined, not "add a JSON
 * widget" territory.
 */
export type Hospital = {
  id: number;
  hospital_name: string;
  city_id: number;
  location_id: number | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  seo_url: string;
  phone_number: string | null;
  timings: string | null;
  address: string | null;
  hospital_image: string | null;
  google_reviews: string | null;
  patient_satisfaction_score: string | null;
  location_360_view: string | null;
  location_map: string | null;
  hospital_description: string | null;
  long_description: string | null;
  hospital_gallery: unknown;
  status: HospitalStatus;
  created_at: string;
  updated_at: string;
  cities: { id: number; city_name: string };
  locations: { id: number; area: string; zipcode: string } | null;
};

/** Mirrors validators/hospital.validator.ts's createHospitalSchema — `hospital_gallery` is intentionally omitted (see note above); the API leaves it unchanged when the key is absent. */
export type CreateHospitalInput = {
  hospital_name: string;
  city_id: number;
  location_id?: number | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  seo_url: string;
  phone_number?: string | null;
  timings?: string | null;
  address?: string | null;
  hospital_image?: string | null;
  google_reviews?: number | string | null;
  patient_satisfaction_score?: number | string | null;
  location_360_view?: string | null;
  location_map?: string | null;
  hospital_description?: string | null;
  long_description?: string | null;
  status?: HospitalStatus;
};

export type UpdateHospitalInput = Partial<CreateHospitalInput>;

export type ListHospitalsFilter = {
  city_id?: number;
  status?: HospitalStatus;
};
