import { z } from "zod";

export const googleReviewStatusSchema = z.enum(["active", "inactive"]);

export const googleReviewIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listGoogleReviewsQuerySchema = z.object({
  google_location: z.string().trim().min(1).optional(),
  status: googleReviewStatusSchema.optional(),
});

// Accepts a plain number or a numeric string; passed through to Prisma
// as-is (no rounding/truncation) and let the DB's own DECIMAL(2,1)
// column enforce precision/scale.
const decimalInputSchema = z.union([
  z.number(),
  z.string().regex(/^-?\d+(\.\d+)?$/, "Must be a valid decimal number"),
]);

export const createGoogleReviewSchema = z.object({
  google_location: z
    .string()
    .trim()
    .min(1, "Google location is required")
    .max(255),
  google_rating: decimalInputSchema.nullable().optional(),
  google_review: z.string().trim().min(1, "Google review text is required"),
  status: googleReviewStatusSchema.optional(),
});

export const updateGoogleReviewSchema = createGoogleReviewSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateGoogleReviewInput = z.infer<typeof createGoogleReviewSchema>;
export type UpdateGoogleReviewInput = z.infer<typeof updateGoogleReviewSchema>;
export type GoogleReviewIdParam = z.infer<typeof googleReviewIdParamSchema>;
export type ListGoogleReviewsQuery = z.infer<
  typeof listGoogleReviewsQuerySchema
>;
