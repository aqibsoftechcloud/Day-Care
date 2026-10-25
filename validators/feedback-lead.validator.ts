import { z } from "zod";

export const feedbackLeadIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listFeedbackLeadsQuerySchema = z.object({
  email: z.string().trim().min(1).optional(),
});

// Mirrors feedback_leads' actual columns exactly — no field invented.
// hospital_location is nullable in the DB, so it may be omitted or sent as null.
export const updateFeedbackLeadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150, "Name is too long"),
  email: z.string().trim().min(1, "Email is required").max(255, "Email is too long").email("Enter a valid email address"),
  phone_number: z.string().trim().min(1, "Phone number is required").max(30, "Phone number is too long"),
  hospital_location: z.string().trim().max(255, "Hospital / location is too long").nullable().optional(),
});

export type FeedbackLeadIdParam = z.infer<typeof feedbackLeadIdParamSchema>;
export type ListFeedbackLeadsQuery = z.infer<
  typeof listFeedbackLeadsQuerySchema
>;
export type UpdateFeedbackLeadInput = z.infer<typeof updateFeedbackLeadSchema>;
