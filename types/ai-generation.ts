/** Mirrors validators/ai-generation.validator.ts's generateContentSchema — the generation-context fields the Speciality form sends. Not a full Speciality row: the speciality may not be saved yet. */
export type GenerateSpecialityContentInput = {
  entity_type: "speciality";
  speciality_name: string;
  speciality_title?: string;
  city_name?: string;
  existing_short_description?: string;
};

/** Mirrors services/ai-generation.service.ts's SpecialityGeneratedContent — only the fields that exist on the real Speciality model/form. */
export type SpecialityGeneratedContent = {
  description: string;
  short_description: string;
  meta_title: string;
  meta_description: string;
  meta_keyword: string;
};
