import { z } from "zod";

export const treatmentSymptomStatusSchema = z.enum(["active", "inactive"]);

export const treatmentSymptomIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listTreatmentSymptomsQuerySchema = z.object({
  treatment_id: z.coerce.number().int().positive().optional(),
  status: treatmentSymptomStatusSchema.optional(),
});

// Non-file fields only — the uploaded image is validated separately in the
// upload layer, using the actual file metadata Zod never sees here.
export const createTreatmentSymptomSchema = z.object({
  treatment_id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1, "Name is required").max(255),
  sorting_order: z.coerce.number().int().optional(),
  status: treatmentSymptomStatusSchema.optional(),
});

// No "at least one field" refinement here: a valid PUT may legitimately
// carry no text fields at all (e.g. only replacing/clearing the image).
// The controller enforces "at least one field OR an image change"
// instead, since only it sees the parsed text fields, the uploaded file,
// and the image-clear sentinel together.
export const updateTreatmentSymptomSchema =
  createTreatmentSymptomSchema.partial();

export type CreateTreatmentSymptomInput = z.infer<
  typeof createTreatmentSymptomSchema
>;
export type UpdateTreatmentSymptomInput = z.infer<
  typeof updateTreatmentSymptomSchema
>;
export type TreatmentSymptomIdParam = z.infer<
  typeof treatmentSymptomIdParamSchema
>;
export type ListTreatmentSymptomsQuery = z.infer<
  typeof listTreatmentSymptomsQuerySchema
>;
