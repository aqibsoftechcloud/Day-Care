import { z } from "zod";

export const internationalPatientLeadIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listInternationalPatientLeadsQuerySchema = z.object({
  country: z.string().trim().min(1).optional(),
});

// Mirrors international_patient_leads' actual columns exactly — no field
// invented. age/gender/country are all nullable in the DB.
export const updateInternationalPatientLeadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150, "Name is too long"),
  age: z.number().int("Age must be a whole number").min(0, "Age must be zero or greater").max(150, "Age is too large").nullable().optional(),
  gender: z.string().trim().max(50, "Gender is too long").nullable().optional(),
  country: z.string().trim().max(100, "Country is too long").nullable().optional(),
});

export type InternationalPatientLeadIdParam = z.infer<
  typeof internationalPatientLeadIdParamSchema
>;
export type ListInternationalPatientLeadsQuery = z.infer<
  typeof listInternationalPatientLeadsQuerySchema
>;
export type UpdateInternationalPatientLeadInput = z.infer<
  typeof updateInternationalPatientLeadSchema
>;
