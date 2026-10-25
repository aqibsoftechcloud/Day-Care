/** Mirrors services/appointment-lead.service.ts's appointmentLeadSelect exactly. */
export type AppointmentLead = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  city_id: number | null;
  treatment_id: number | null;
  global_treatment_id: number | null;
  /** [{ key, label, value }] — city/treatment name snapshots plus every custom-field answer. */
  extra_data: { key: string; label: string; value: string }[] | null;
  created_at: string;
  updated_at: string;
};

/** Mirrors validators/appointment-lead.validator.ts's createAppointmentLeadSchema/updateAppointmentLeadSchema (same 4 fields). */
export type CreateAppointmentLeadInput = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
};

export type UpdateAppointmentLeadInput = CreateAppointmentLeadInput;

/** Mirrors services/feedback-lead.service.ts's feedbackLeadSelect exactly. */
export type FeedbackLead = {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  hospital_location: string | null;
  created_at: string;
  updated_at: string;
};

/** Mirrors validators/feedback-lead.validator.ts's updateFeedbackLeadSchema. */
export type UpdateFeedbackLeadInput = {
  name: string;
  email: string;
  phone_number: string;
  hospital_location?: string | null;
};

/** Mirrors services/international-patient-lead.service.ts's internationalPatientLeadSelect exactly. */
export type InternationalPatientLead = {
  id: number;
  name: string;
  age: number | null;
  gender: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
};

/** Mirrors validators/international-patient-lead.validator.ts's updateInternationalPatientLeadSchema. */
export type UpdateInternationalPatientLeadInput = {
  name: string;
  age?: number | null;
  gender?: string | null;
  country?: string | null;
};

export type BookaformDataStatus = "active" | "inactive";

/** Mirrors services/bookaform.service.ts's bookaformDataSelect exactly. */
export type BookaformData = {
  id: number;
  data_from: string;
  status: BookaformDataStatus;
  created_at: string;
  updated_at: string;
};

/** Mirrors validators/bookaform.validator.ts's updateBookaformDataSchema. */
export type UpdateBookaformDataInput = {
  data_from: string;
  status: BookaformDataStatus;
};
