export type TreatmentFaqStatus = "active" | "inactive";

/** Mirrors services/treatment-faq.service.ts's toSafeTreatmentFaq() output — embeds `treatment` alongside the raw `treatment_id` scalar. */
export type TreatmentFaq = {
  id: number;
  treatment_id: number;
  title: string;
  text: string;
  status: TreatmentFaqStatus;
  created_at: string;
  updated_at: string;
  treatment: { id: number; sub_speciality_name: string; sub_speciality_title: string | null; seo_url: string };
};

/** Mirrors validators/treatment-faq.validator.ts's createTreatmentFaqSchema. */
export type CreateTreatmentFaqInput = {
  treatment_id: number;
  title: string;
  text: string;
  status?: TreatmentFaqStatus;
};

export type UpdateTreatmentFaqInput = Partial<CreateTreatmentFaqInput>;
