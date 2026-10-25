import { z } from "zod";

export const galleryTypeSchema = z.enum(["image", "video"]);
export const galleryStatusSchema = z.enum(["active", "inactive"]);

export const galleryIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listGalleryQuerySchema = z.object({
  gallery_type: galleryTypeSchema.optional(),
  gallery_status: galleryStatusSchema.optional(),
  hospital_id: z.coerce.number().int().positive().optional(),
});

// `source` is a generic VarChar(1000) string shared by both "image" and
// "video" gallery_type rows (e.g. an external video URL for video
// entries, or a pasted external image URL) — it is always validated and
// stored as a plain string. For a hospital-scoped "image" row, the admin
// UI may instead upload a real file; the controller resolves that upload
// to a path and writes it into this same `source` field (see
// services/gallery.service.ts's `createGalleryItem`/`updateGalleryItem`
// optional `image` param) rather than adding a second image column.
export const createGallerySchema = z.object({
  hospital_id: z.coerce.number().int().positive().nullable().optional(),
  gallery_name: z
    .string()
    .trim()
    .min(1, "Gallery name is required")
    .max(255),
  meta_title: z.string().trim().max(255).nullable().optional(),
  meta_keyword: z.string().trim().max(500).nullable().optional(),
  meta_description: z.string().trim().nullable().optional(),
  gallery_type: galleryTypeSchema,
  gallery_status: galleryStatusSchema.optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255),
  source: z.string().trim().max(1000).nullable().optional(),
  sorting_order: z.coerce.number().int().min(0).optional(),
});

export const updateGallerySchema = createGallerySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateGalleryInput = z.infer<typeof createGallerySchema>;
export type UpdateGalleryInput = z.infer<typeof updateGallerySchema>;
export type GalleryIdParam = z.infer<typeof galleryIdParamSchema>;
export type ListGalleryQuery = z.infer<typeof listGalleryQuerySchema>;
