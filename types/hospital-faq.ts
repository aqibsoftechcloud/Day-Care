export type HospitalFaqStatus = "active" | "inactive";

/** Mirrors services/hospital-faq.service.ts's toSafeHospitalFaq() output — embeds `hospital` alongside the raw `hospital_id` scalar. */
export type HospitalFaq = {
  id: number;
  hospital_id: number;
  title: string;
  text: string;
  status: HospitalFaqStatus;
  created_at: string;
  updated_at: string;
  hospital: { id: number; hospital_name: string; seo_url: string };
};

/** Mirrors validators/hospital-faq.validator.ts's createHospitalFaqSchema. */
export type CreateHospitalFaqInput = {
  hospital_id: number;
  title: string;
  text: string;
  status?: HospitalFaqStatus;
};

export type UpdateHospitalFaqInput = Partial<CreateHospitalFaqInput>;
