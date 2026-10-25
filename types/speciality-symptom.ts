export type SpecialitySymptomStatus = "active" | "inactive";

/** Mirrors services/speciality-symptom.service.ts's toSafeSpecialitySymptom() output — embeds `speciality` alongside the raw `speciality_id` scalar. `image` is a storage path/URL, not an embedded file. */
export type SpecialitySymptom = {
  id: number;
  speciality_id: number;
  name: string;
  image: string | null;
  sorting_order: number;
  status: SpecialitySymptomStatus;
  created_at: string;
  updated_at: string;
  speciality: { id: number; speciality_name: string; speciality_title: string | null; seo_url: string };
};

/** Mirrors validators/speciality-symptom.validator.ts's createSpecialitySymptomSchema — `image` is deliberately excluded (handled as a multipart file, not JSON). */
export type CreateSpecialitySymptomInput = {
  speciality_id: number;
  name: string;
  sorting_order?: number;
  status?: SpecialitySymptomStatus;
};

export type UpdateSpecialitySymptomInput = Partial<CreateSpecialitySymptomInput>;
