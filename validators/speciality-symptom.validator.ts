import { z } from "zod";

export const specialitySymptomStatusSchema = z.enum(["active", "inactive"]);

export const specialitySymptomIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listSpecialitySymptomsQuerySchema = z.object({
  speciality_id: z.coerce.number().int().positive().optional(),
  status: specialitySymptomStatusSchema.optional(),
});

// Non-file fields only — the uploaded image is validated separately in the
// upload layer, using the actual file metadata Zod never sees here.
export const createSpecialitySymptomSchema = z.object({
  speciality_id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1, "Name is required").max(255),
  sorting_order: z.coerce.number().int().optional(),
  status: specialitySymptomStatusSchema.optional(),
});

// No "at least one field" refinement here: a valid PUT may legitimately
// carry no text fields at all (e.g. replacing only the image). The
// controller enforces "at least one field OR a new image" instead, since
// only it sees both the parsed text fields and the uploaded file together.
export const updateSpecialitySymptomSchema =
  createSpecialitySymptomSchema.partial();

export type CreateSpecialitySymptomInput = z.infer<
  typeof createSpecialitySymptomSchema
>;
export type UpdateSpecialitySymptomInput = z.infer<
  typeof updateSpecialitySymptomSchema
>;
export type SpecialitySymptomIdParam = z.infer<
  typeof specialitySymptomIdParamSchema
>;
export type ListSpecialitySymptomsQuery = z.infer<
  typeof listSpecialitySymptomsQuerySchema
>;
