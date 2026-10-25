import { z } from "zod";

export const cityStatusSchema = z.enum(["active", "inactive"]);

export const cityIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createCitySchema = z.object({
  language_id: z.coerce.number().int().positive(),
  city_name: z.string().trim().min(1, "City name is required").max(150),
  meta_title: z.string().trim().max(255).nullable().optional(),
  meta_description: z.string().trim().nullable().optional(),
  meta_keywords: z.string().trim().max(500).nullable().optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255),
  status: cityStatusSchema.optional(),
});

export const updateCitySchema = createCitySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export type CreateCityInput = z.infer<typeof createCitySchema>;
export type UpdateCityInput = z.infer<typeof updateCitySchema>;
export type CityIdParam = z.infer<typeof cityIdParamSchema>;
