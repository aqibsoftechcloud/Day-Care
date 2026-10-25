export type SpecialityFaqStatus = "active" | "inactive";

/** Mirrors services/speciality-faq.service.ts's toSafeSpecialityFaq() output — embeds `speciality` alongside the raw `speciality_id` scalar. */
export type SpecialityFaq = {
  id: number;
  speciality_id: number;
  title: string;
  text: string;
  status: SpecialityFaqStatus;
  created_at: string;
  updated_at: string;
  speciality: { id: number; speciality_name: string; speciality_title: string | null; seo_url: string };
};

/** Mirrors validators/speciality-faq.validator.ts's createSpecialityFaqSchema. */
export type CreateSpecialityFaqInput = {
  speciality_id: number;
  title: string;
  text: string;
  status?: SpecialityFaqStatus;
};

export type UpdateSpecialityFaqInput = Partial<CreateSpecialityFaqInput>;
