/** Centralized TanStack Query keys for the Lead Management modules. */
export const leadsKeys = {
  appointments: ["leads", "appointments"] as const,
  appointmentDetail: (id: number) => ["leads", "appointments", id] as const,
  feedback: ["leads", "feedback"] as const,
  feedbackDetail: (id: number) => ["leads", "feedback", id] as const,
  internationalPatients: ["leads", "international-patients"] as const,
  internationalPatientDetail: (id: number) =>
    ["leads", "international-patients", id] as const,
  bookaform: ["leads", "bookaform"] as const,
  bookaformDetail: (id: number) => ["leads", "bookaform", id] as const,
};
