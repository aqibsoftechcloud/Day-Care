export type NewsMediaStatus = "active" | "inactive";

/** Mirrors services/news-media.service.ts's raw Prisma return — no select clause, no relations (news_media has none). */
export type NewsMedia = {
  id: number;
  title: string;
  location: string | null;
  date: string | null;
  view_image: string | null;
  view_link: string | null;
  status: NewsMediaStatus;
  created_at: string;
  updated_at: string;
};

/** Mirrors validators/news-media.validator.ts's listNewsMediaQuerySchema. */
export type ListNewsMediaFilter = {
  status?: NewsMediaStatus;
};

/** Mirrors validators/news-media.validator.ts's createNewsMediaSchema — `view_image` is handled separately as a File (multipart upload). `view_link` is a plain URL string despite the name, not an upload. */
export type CreateNewsMediaInput = {
  title: string;
  location?: string | null;
  date?: string | null;
  view_link?: string | null;
  status?: NewsMediaStatus;
};

export type UpdateNewsMediaInput = Partial<CreateNewsMediaInput>;
