import { prisma } from "@/lib/prisma";
import { storageProvider } from "@/lib/storage";
import type {
  CreateNewsMediaInput,
  ListNewsMediaQuery,
  UpdateNewsMediaInput,
} from "@/validators/news-media.validator";

export class NewsMediaNotFoundError extends Error {
  constructor(id: number) {
    super(`News & media item with id ${id} not found`);
    this.name = "NewsMediaNotFoundError";
  }
}

export type NewsMediaImageInput = { buffer: Buffer; mimeType: string };

const NEWS_MEDIA_UPLOAD_FOLDER = "news-media";

export function getNewsMediaList(filter?: ListNewsMediaQuery) {
  return prisma.news_media.findMany({
    where:
      filter?.status !== undefined ? { status: filter.status } : undefined,
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
  });
}

export async function getNewsMediaById(id: number) {
  const newsMedia = await prisma.news_media.findUnique({ where: { id } });

  if (!newsMedia) {
    throw new NewsMediaNotFoundError(id);
  }

  return newsMedia;
}

export async function createNewsMedia(
  data: CreateNewsMediaInput,
  image?: NewsMediaImageInput
) {
  const imagePath = image
    ? await storageProvider.upload(image, NEWS_MEDIA_UPLOAD_FOLDER)
    : null;

  return prisma.news_media.create({
    data: { ...data, view_image: imagePath },
  });
}

/**
 * Update ordering for image replacement (safer than naive "delete old,
 * then write new"): a new image is uploaded first, then the DB is
 * updated; the OLD image is only deleted once that DB update has
 * succeeded (best-effort). If the DB update fails, the newly uploaded
 * file is best-effort cleaned up instead.
 *
 * The `image` parameter has three distinct states:
 * - `undefined`: no change — the existing image is preserved.
 * - `null`: an explicit clear — the DB field is set to NULL, and the old
 *   file is deleted (best-effort) only after that update succeeds.
 * - a real file: replace — upload, update, then delete the old file.
 */
export async function updateNewsMedia(
  id: number,
  data: UpdateNewsMediaInput,
  image?: NewsMediaImageInput | null
) {
  const current = await prisma.news_media.findUnique({ where: { id } });

  if (!current) {
    throw new NewsMediaNotFoundError(id);
  }

  let newImagePath: string | null | undefined;

  if (image === null) {
    newImagePath = null;
  } else if (image) {
    newImagePath = await storageProvider.upload(
      image,
      NEWS_MEDIA_UPLOAD_FOLDER
    );
  }

  try {
    const newsMedia = await prisma.news_media.update({
      where: { id },
      data: {
        ...data,
        ...(newImagePath !== undefined ? { view_image: newImagePath } : {}),
        updated_at: new Date(),
      },
    });

    if (newImagePath !== undefined && current.view_image) {
      await storageProvider
        .delete(current.view_image)
        .catch((error) =>
          console.error("Failed to delete old news & media image:", error)
        );
    }

    return newsMedia;
  } catch (error) {
    if (newImagePath) {
      await storageProvider
        .delete(newImagePath)
        .catch((cleanupError) =>
          console.error(
            "Failed to clean up newly uploaded news & media image after a failed update:",
            cleanupError
          )
        );
    }

    throw error;
  }
}

/**
 * Soft delete: deactivates the news & media item by setting status to
 * "inactive". Content and the associated image are preserved.
 */
export async function deleteNewsMedia(id: number) {
  const current = await prisma.news_media.findUnique({ where: { id } });

  if (!current) {
    throw new NewsMediaNotFoundError(id);
  }

  await prisma.news_media.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
