export type GlobalTreatmentFaqStatus = "active" | "inactive";

export type GlobalTreatmentFaq = {
  id: number;
  global_treatment_id: number;
  title: string;
  text: string;
  status: GlobalTreatmentFaqStatus;
  created_at: string;
  updated_at: string;
};

export type CreateGlobalTreatmentFaqInput = {
  global_treatment_id: number;
  title: string;
  text: string;
  status?: GlobalTreatmentFaqStatus;
};

export type UpdateGlobalTreatmentFaqInput = Partial<CreateGlobalTreatmentFaqInput>;
