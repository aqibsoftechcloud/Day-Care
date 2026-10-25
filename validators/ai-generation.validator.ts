import { z } from "zod";

// entity_type is a literal today (only Speciality generation exists) —
// deliberately not a generic "generate anything" schema. Extending to a
// second entity type means adding a second literal + its own context
// shape here, not inventing an open-ended contract now.
export const generateContentSchema = z.object({
  entity_type: z.literal("speciality"),
  speciality_name: z.string().trim().min(1, "Speciality name is required").max(255),
  speciality_title: z.string().trim().max(255).optional(),
  city_name: z.string().trim().max(255).optional(),
  existing_short_description: z.string().trim().optional(),
});

export type GenerateContentInput = z.infer<typeof generateContentSchema>;
