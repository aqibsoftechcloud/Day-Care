export type LanguageStatus = "active" | "inactive";

/** Mirrors services/language.service.ts's plain row output — no select/omit applied. */
export type Language = {
  id: number;
  name: string;
  seo_url: string;
  status: LanguageStatus;
  created_at: string;
  updated_at: string;
};

/** Mirrors validators/language.validator.ts's createLanguageSchema. */
export type CreateLanguageInput = {
  name: string;
  seo_url: string;
  status?: LanguageStatus;
};

export type UpdateLanguageInput = Partial<CreateLanguageInput>;
