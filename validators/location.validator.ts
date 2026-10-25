import { z } from "zod";

export const locationStatusSchema = z.enum(["active", "inactive"]);

export const locationIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createLocationSchema = z.object({
  city_id: z.coerce.number().int().positive(),
  area: z.string().trim().min(1, "Area is required").max(150),
  zipcode: z.string().trim().min(1, "Zipcode is required").max(20),
  meta_title: z.string().trim().max(255).nullable().optional(),
  meta_description: z.string().trim().nullable().optional(),
  meta_keywords: z.string().trim().max(500).nullable().optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255),
  status: locationStatusSchema.optional(),
});

export const updateLocationSchema = createLocationSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type LocationIdParam = z.infer<typeof locationIdParamSchema>;
