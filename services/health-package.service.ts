import { prisma } from "@/lib/prisma";
import { sanitizeHtmlFields } from "@/lib/sanitize-html.server";
import { storageProvider } from "@/lib/storage";
import type {
  CreateHealthPackageInput,
  ListHealthPackagesQuery,
  UpdateHealthPackageInput,
} from "@/validators/health-package.validator";

export class HealthPackageNotFoundError extends Error {
  constructor(id: number) {
    super(`Health package with id ${id} not found`);
    this.name = "HealthPackageNotFoundError";
  }
}

export type HealthPackageImageInput = { buffer: Buffer; mimeType: string };

const HEALTH_PACKAGE_UPLOAD_FOLDER = "health-packages";

export function getHealthPackages(filter?: ListHealthPackagesQuery) {
  return prisma.healthcheck_packs.findMany({
    where:
      filter?.status !== undefined ? { status: filter.status } : undefined,
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
  });
}

export async function getHealthPackageById(id: number) {
  const healthPackage = await prisma.healthcheck_packs.findUnique({
    where: { id },
  });

  if (!healthPackage) {
    throw new HealthPackageNotFoundError(id);
  }

  return healthPackage;
}

/**
 * Public lookup by `seo_url` — returns the active health package, or
 * `null` if none is active with this seo_url (never throws).
 */
export function getHealthPackageBySeoUrl(seoUrl: string) {
  return prisma.healthcheck_packs.findFirst({
    where: { seo_url: seoUrl, status: "active" },
  });
}

export async function createHealthPackage(
  input: CreateHealthPackageInput,
  image?: HealthPackageImageInput
) {
  const data = sanitizeHtmlFields(input, ["package_inclusions"]);
  const imagePath = image
    ? await storageProvider.upload(image, HEALTH_PACKAGE_UPLOAD_FOLDER)
    : null;

  return prisma.healthcheck_packs.create({
    data: { ...data, pack_image: imagePath },
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
export async function updateHealthPackage(
  id: number,
  input: UpdateHealthPackageInput,
  image?: HealthPackageImageInput | null
) {
  const data = sanitizeHtmlFields(input, ["package_inclusions"]);
  const current = await prisma.healthcheck_packs.findUnique({
    where: { id },
  });

  if (!current) {
    throw new HealthPackageNotFoundError(id);
  }

  let newImagePath: string | null | undefined;

  if (image === null) {
    newImagePath = null;
  } else if (image) {
    newImagePath = await storageProvider.upload(
      image,
      HEALTH_PACKAGE_UPLOAD_FOLDER
    );
  }

  try {
    const healthPackage = await prisma.healthcheck_packs.update({
      where: { id },
      data: {
        ...data,
        ...(newImagePath !== undefined ? { pack_image: newImagePath } : {}),
        updated_at: new Date(),
      },
    });

    if (newImagePath !== undefined && current.pack_image) {
      await storageProvider
        .delete(current.pack_image)
        .catch((error) =>
          console.error("Failed to delete old health package image:", error)
        );
    }

    return healthPackage;
  } catch (error) {
    if (newImagePath) {
      await storageProvider
        .delete(newImagePath)
        .catch((cleanupError) =>
          console.error(
            "Failed to clean up newly uploaded health package image after a failed update:",
            cleanupError
          )
        );
    }

    throw error;
  }
}

/**
 * Soft delete: deactivates the health package by setting status to
 * "inactive". Content and the associated image are preserved.
 */
export async function deleteHealthPackage(id: number) {
  const current = await prisma.healthcheck_packs.findUnique({
    where: { id },
  });

  if (!current) {
    throw new HealthPackageNotFoundError(id);
  }

  await prisma.healthcheck_packs.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
