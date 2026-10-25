export type SymptomPartStatus = "active" | "inactive";

/** Mirrors services/symptom-part.service.ts's raw Prisma return — no select clause, no relations. */
export type SymptomPart = {
  id: number;
  part_name: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  seo_url: string;
  part_description: string | null;
  status: SymptomPartStatus;
  created_at: string;
  updated_at: string;
};

/** Mirrors validators/symptom-part.validator.ts's listSymptomPartsQuerySchema. */
export type ListSymptomPartsFilter = {
  status?: SymptomPartStatus;
};

/** Mirrors validators/symptom-part.validator.ts's createSymptomPartSchema. */
export type CreateSymptomPartInput = {
  part_name: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  seo_url: string;
  part_description?: string | null;
  status?: SymptomPartStatus;
};

export type UpdateSymptomPartInput = Partial<CreateSymptomPartInput>;
