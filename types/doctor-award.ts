export type DoctorAwardStatus = "active" | "inactive";

/** Mirrors services/doctor-award.service.ts's toSafeDoctorAward() output — embeds `doctor` alongside the raw `doctor_id` scalar. */
export type DoctorAward = {
  id: number;
  doctor_id: number;
  title: string;
  organization: string | null;
  award_year: string | null;
  description: string | null;
  status: DoctorAwardStatus;
  created_at: string;
  updated_at: string;
  doctor: { id: number; doctor_name: string; seo_url: string };
};

/** Mirrors validators/doctor-award.validator.ts's createDoctorAwardSchema. */
export type CreateDoctorAwardInput = {
  doctor_id: number;
  title: string;
  organization?: string | null;
  award_year?: string | null;
  description?: string | null;
  status?: DoctorAwardStatus;
};

export type UpdateDoctorAwardInput = Partial<CreateDoctorAwardInput>;
