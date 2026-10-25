export type DoctorFaqStatus = "active" | "inactive";

/** Mirrors services/doctor-faq.service.ts's toSafeDoctorFaq() output — embeds `doctor` alongside the raw `doctor_id` scalar. */
export type DoctorFaq = {
  id: number;
  doctor_id: number;
  title: string;
  text: string;
  status: DoctorFaqStatus;
  created_at: string;
  updated_at: string;
  doctor: { id: number; doctor_name: string; seo_url: string };
};

/** Mirrors validators/doctor-faq.validator.ts's createDoctorFaqSchema. */
export type CreateDoctorFaqInput = {
  doctor_id: number;
  title: string;
  text: string;
  status?: DoctorFaqStatus;
};

export type UpdateDoctorFaqInput = Partial<CreateDoctorFaqInput>;
