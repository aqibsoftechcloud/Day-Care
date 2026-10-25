export type SymptomArticleStatus = "active" | "inactive";

/** Mirrors services/symptom-article.service.ts's toSafeSymptomArticle() output — embeds `part`/`symptom` (renamed from the raw `symptom_parts`/`symptoms` relations). */
export type SymptomArticle = {
  id: number;
  article_name: string;
  part_id: number;
  symptom_id: number;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  seo_url: string;
  description: string | null;
  status: SymptomArticleStatus;
  created_at: string;
  updated_at: string;
  part: { id: number; part_name: string };
  symptom: { id: number; symptom_name: string };
};

/** Mirrors validators/symptom-article.validator.ts's listSymptomArticlesQuerySchema. */
export type ListSymptomArticlesFilter = {
  part_id?: number;
  symptom_id?: number;
  status?: SymptomArticleStatus;
};

/**
 * Mirrors validators/symptom-article.validator.ts's createSymptomArticleSchema
 * exactly. Note: the backend validates part_id and symptom_id independently —
 * it does not require the symptom to actually belong to the given part.
 */
export type CreateSymptomArticleInput = {
  article_name: string;
  part_id: number;
  symptom_id: number;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  seo_url: string;
  description?: string | null;
  status?: SymptomArticleStatus;
};

export type UpdateSymptomArticleInput = Partial<CreateSymptomArticleInput>;
