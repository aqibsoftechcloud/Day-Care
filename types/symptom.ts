export type SymptomStatus = "active" | "inactive";

/** Mirrors services/symptom.service.ts's toSafeSymptom() output — embeds `part` (renamed from the raw `symptom_parts` relation). */
export type Symptom = {
  id: number;
  part_id: number;
  symptom_name: string;
  status: SymptomStatus;
  created_at: string;
  updated_at: string;
  part: { id: number; part_name: string };
};

/** Mirrors validators/symptom.validator.ts's listSymptomsQuerySchema. */
export type ListSymptomsFilter = {
  part_id?: number;
  status?: SymptomStatus;
};

/** Mirrors validators/symptom.validator.ts's createSymptomSchema. */
export type CreateSymptomInput = {
  part_id: number;
  symptom_name: string;
  status?: SymptomStatus;
};

export type UpdateSymptomInput = Partial<CreateSymptomInput>;
