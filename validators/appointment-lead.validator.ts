import { z } from "zod";

export const appointmentLeadIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listAppointmentLeadsQuerySchema = z.object({
  email: z.string().trim().min(1).optional(),
});

// Mirrors appointment_leads' actual columns exactly — no field invented.
// Shared by both the public create endpoint (the site visitor's own
// submission) and the admin update endpoint, since both write the same
// four real columns.
const appointmentLeadFieldsSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100, "First name is too long"),
  // Both may legitimately be empty: the configurable consultation form
  // collects a single "Full Name" (stored as first + remainder) and treats
  // email as an optional field.
  last_name: z.string().trim().max(100, "Last name is too long"),
  email: z.union([z.literal(""), z.string().trim().max(255, "Email is too long").email("Enter a valid email address")]),
  phone_number: z.string().trim().min(1, "Phone number is required").max(30, "Phone number is too long"),
});

export const createAppointmentLeadSchema = appointmentLeadFieldsSchema;
export const updateAppointmentLeadSchema = appointmentLeadFieldsSchema;

export type AppointmentLeadIdParam = z.infer<
  typeof appointmentLeadIdParamSchema
>;
export type ListAppointmentLeadsQuery = z.infer<
  typeof listAppointmentLeadsQuerySchema
>;
export type CreateAppointmentLeadInput = z.infer<
  typeof createAppointmentLeadSchema
>;
export type UpdateAppointmentLeadInput = z.infer<
  typeof updateAppointmentLeadSchema
>;
