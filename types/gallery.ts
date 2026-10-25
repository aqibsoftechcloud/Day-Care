export type GalleryType = "image" | "video";
export type GalleryStatus = "active" | "inactive";

/**
 * Mirrors services/gallery.service.ts's raw Prisma return — no select
 * clause, no relations (gallery has none). Note the status column is
 * named `gallery_status`, not `status` (confirmed by reading the service's
 * own doc comment on deleteGalleryItem).
 */
export type Gallery = {
  id: number;
  hospital_id: number | null;
  gallery_name: string;
  meta_title: string | null;
  meta_keyword: string | null;
  meta_description: string | null;
  gallery_type: GalleryType;
  gallery_status: GalleryStatus;
  seo_url: string;
  source: string | null;
  sorting_order: number;
  created_at: string;
  updated_at: string;
};

/** Mirrors validators/gallery.validator.ts's listGalleryQuerySchema. */
export type ListGalleryFilter = {
  gallery_type?: GalleryType;
  gallery_status?: GalleryStatus;
  hospital_id?: number;
};

/**
 * Mirrors validators/gallery.validator.ts's createGallerySchema exactly.
 * `source` is a generic string shared by both image/video rows (e.g. an
 * external URL for video entries, or a pasted external image URL). An
 * "image" row may instead be created/updated with a real uploaded file
 * (see `createGalleryItem`/`updateGalleryItem` in lib/api/gallery.ts) —
 * the server resolves that upload to a path and writes it into this
 * same `source` field.
 */
export type CreateGalleryInput = {
  hospital_id?: number | null;
  gallery_name: string;
  meta_title?: string | null;
  meta_keyword?: string | null;
  meta_description?: string | null;
  gallery_type: GalleryType;
  gallery_status?: GalleryStatus;
  seo_url: string;
  source?: string | null;
  sorting_order?: number;
};

export type UpdateGalleryInput = Partial<CreateGalleryInput>;
