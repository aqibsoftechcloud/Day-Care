export type GeneralFaqStatus = "active" | "inactive";

/** Mirrors services/general-faq.service.ts's plain row output. */
export type GeneralFaq = {
  id: number;
  question: string;
  answer: string;
  status: GeneralFaqStatus;
  created_at: string;
  updated_at: string;
};

/** Mirrors validators/general-faq.validator.ts's createGeneralFaqSchema. */
export type CreateGeneralFaqInput = {
  question: string;
  answer: string;
  status?: GeneralFaqStatus;
};

export type UpdateGeneralFaqInput = Partial<CreateGeneralFaqInput>;
