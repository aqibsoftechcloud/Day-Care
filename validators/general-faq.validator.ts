import { z } from "zod";

export const generalFaqStatusSchema = z.enum(["active", "inactive"]);

export const generalFaqIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listGeneralFaqsQuerySchema = z.object({
  status: generalFaqStatusSchema.optional(),
});

export const createGeneralFaqSchema = z.object({
  question: z.string().trim().min(1, "Question is required"),
  // Not trimmed: LongText CMS content, stored exactly as submitted.
  answer: z.string().min(1, "Answer is required"),
  status: generalFaqStatusSchema.optional(),
});

export const updateGeneralFaqSchema = createGeneralFaqSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateGeneralFaqInput = z.infer<typeof createGeneralFaqSchema>;
export type UpdateGeneralFaqInput = z.infer<typeof updateGeneralFaqSchema>;
export type GeneralFaqIdParam = z.infer<typeof generalFaqIdParamSchema>;
export type ListGeneralFaqsQuery = z.infer<typeof listGeneralFaqsQuerySchema>;
