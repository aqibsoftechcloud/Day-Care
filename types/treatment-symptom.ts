export type TreatmentSymptomStatus = "active" | "inactive";

/** Mirrors services/treatment-symptom.service.ts's toSafeTreatmentSymptom() output — embeds `treatment` alongside the raw `treatment_id` scalar. `image` is a storage path/URL, not an embedded file. */
export type TreatmentSymptom = {
  id: number;
  treatment_id: number;
  name: string;
  image: string | null;
  sorting_order: number;
  status: TreatmentSymptomStatus;
  created_at: string;
  updated_at: string;
  treatment: { id: number; sub_speciality_name: string; sub_speciality_title: string | null; seo_url: string };
};

/** Mirrors validators/treatment-symptom.validator.ts's createTreatmentSymptomSchema — `image` is deliberately excluded (handled as a multipart file, not JSON). */
export type CreateTreatmentSymptomInput = {
  treatment_id: number;
  name: string;
  sorting_order?: number;
  status?: TreatmentSymptomStatus;
};

export type UpdateTreatmentSymptomInput = Partial<CreateTreatmentSymptomInput>;
