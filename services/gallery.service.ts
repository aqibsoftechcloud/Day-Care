import { prisma } from "@/lib/prisma";
import { storageProvider } from "@/lib/storage";
import type {
  CreateGalleryInput,
  ListGalleryQuery,
  UpdateGalleryInput,
} from "@/validators/gallery.validator";

export class GalleryNotFoundError extends Error {
  constructor(id: number) {
    super(`Gallery item with id ${id} not found`);
    this.name = "GalleryNotFoundError";
  }
}

export type GalleryImageInput = { buffer: Buffer; mimeType: string };

const GALLERY_UPLOAD_FOLDER = "gallery";

export function getGalleryItems(filter?: ListGalleryQuery) {
  return prisma.gallery.findMany({
    where: {
      ...(filter?.gallery_type !== undefined
        ? { gallery_type: filter.gallery_type }
        : {}),
      ...(filter?.gallery_status !== undefined
        ? { gallery_status: filter.gallery_status }
        : {}),
      ...(filter?.hospital_id !== undefined
        ? { hospital_id: filter.hospital_id }
        : {}),
    },
    orderBy: [{ sorting_order: "asc" }, { created_at: "desc" }, { id: "desc" }],
  });
}

/** Active-only, hospital-scoped — the one function the public Hospital Gallery section calls. Never a city/other-hospital fallback. */
export function getActiveHospitalGalleryItems(hospitalId: number) {
  return prisma.gallery.findMany({
    where: { hospital_id: hospitalId, gallery_status: "active" },
    orderBy: [{ sorting_order: "asc" }, { id: "asc" }],
  });
}

export async function getGalleryItemById(id: number) {
  const galleryItem = await prisma.gallery.findUnique({ where: { id } });

  if (!galleryItem) {
    throw new GalleryNotFoundError(id);
  }

  return galleryItem;
}

/** `image`, when provided, is uploaded and its stored path overrides `data.source` — same "real upload wins over a pasted source string" convention every other image-bearing entity in this codebase follows. */
export async function createGalleryItem(data: CreateGalleryInput, image?: GalleryImageInput) {
  const imagePath = image ? await storageProvider.upload(image, GALLERY_UPLOAD_FOLDER) : undefined;

  return prisma.gallery.create({
    data: { ...data, ...(imagePath !== undefined ? { source: imagePath } : {}) },
  });
}

/**
 * Same image-replace ordering as `updateTreatment`: a new image is
 * uploaded first, the DB update only happens after that succeeds, and
 * the OLD file is deleted only once the DB update has succeeded
 * (best-effort cleanup). Only deletes the old file when it looks like
 * one of our own local uploads (`source` starting with "/") — never
 * attempts to "delete" an admin-pasted external URL.
 */
export async function updateGalleryItem(id: number, data: UpdateGalleryInput, image?: GalleryImageInput) {
  const current = await getGalleryItemById(id);

  let newImagePath: string | undefined;
  if (image) {
    newImagePath = await storageProvider.upload(image, GALLERY_UPLOAD_FOLDER);
  }

  try {
    const updated = await prisma.gallery.update({
      where: { id },
      data: {
        ...data,
        ...(newImagePath !== undefined ? { source: newImagePath } : {}),
        updated_at: new Date(),
      },
    });

    if (newImagePath !== undefined && current.source?.startsWith("/")) {
      await storageProvider.delete(current.source).catch((cleanupError) => {
        console.error("Failed to clean up previous gallery image after update:", cleanupError);
      });
    }

    return updated;
  } catch (error) {
    if (newImagePath !== undefined) {
      await storageProvider.delete(newImagePath).catch((cleanupError) => {
        console.error("Failed to clean up newly uploaded gallery image after a failed update:", cleanupError);
      });
    }

    throw error;
  }
}

/**
 * Soft delete: deactivates the item by setting gallery_status to
 * "inactive". Note: this table's status column is named gallery_status,
 * not status.
 */
export async function deleteGalleryItem(id: number) {
  await getGalleryItemById(id);

  await prisma.gallery.update({
    where: { id },
    data: { gallery_status: "inactive", updated_at: new Date() },
  });
}
