export type DoctorSpecialityStatus = "active" | "inactive";

/** Mirrors services/doctor-speciality.service.ts's toSafeDoctorSpeciality() output — embeds `language` (renamed from the raw `languages` relation). */
export type DoctorSpeciality = {
  id: number;
  language_id: number;
  speciality_name: string;
  seo_url: string;
  status: DoctorSpecialityStatus;
  created_at: string;
  updated_at: string;
  language: { id: number; name: string; seo_url: string };
};

/** Mirrors validators/doctor-speciality.validator.ts's listDoctorSpecialitiesQuerySchema. */
export type ListDoctorSpecialitiesFilter = {
  language_id?: number;
  status?: DoctorSpecialityStatus;
};

/** Mirrors validators/doctor-speciality.validator.ts's createDoctorSpecialitySchema. */
export type CreateDoctorSpecialityInput = {
  language_id: number;
  speciality_name: string;
  seo_url: string;
  status?: DoctorSpecialityStatus;
};

export type UpdateDoctorSpecialityInput = Partial<CreateDoctorSpecialityInput>;

/**
 * Narrower read-only shape used by Doctors Management's "map specialities"
 * picker (DoctorSpecialitiesMappingDialog) — kept as an alias of the full
 * type since the picker only ever reads `id`/`speciality_name`/`status`.
 */
export type DoctorSpecialityOption = Pick<DoctorSpeciality, "id" | "speciality_name" | "status">;
