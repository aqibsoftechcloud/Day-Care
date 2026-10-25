export type GlobalSpecialityFaqStatus = "active" | "inactive";

export type GlobalSpecialityFaq = {
  id: number;
  global_speciality_id: number;
  title: string;
  text: string;
  status: GlobalSpecialityFaqStatus;
  created_at: string;
  updated_at: string;
};

export type CreateGlobalSpecialityFaqInput = {
  global_speciality_id: number;
  title: string;
  text: string;
  status?: GlobalSpecialityFaqStatus;
};

export type UpdateGlobalSpecialityFaqInput = Partial<CreateGlobalSpecialityFaqInput>;
