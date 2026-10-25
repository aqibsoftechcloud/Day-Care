import { z } from "zod";

export const bannerStatusSchema = z.enum(["active", "inactive"]);

export const bannerIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Non-file fields only — uploaded images are validated separately in the
// upload layer, using the actual file metadata Zod never sees here.
export const createBannerSchema = z.object({
  banner_name: z.string().trim().min(1, "Banner name is required").max(255),
  banner_url: z.string().trim().max(500).nullable().optional(),
  city_id: z.coerce.number().int().positive(),
  sorting_order: z.coerce.number().int().optional(),
  status: bannerStatusSchema.optional(),
});

// No "at least one field" refinement here: a valid PUT may legitimately
// carry no text fields at all (e.g. replacing only an image file).
export const updateBannerSchema = createBannerSchema.partial();

export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
export type BannerIdParam = z.infer<typeof bannerIdParamSchema>;
