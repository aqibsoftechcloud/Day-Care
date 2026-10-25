import { prisma } from "@/lib/prisma";
import { sanitizeHtmlFields } from "@/lib/sanitize-html.server";
import { storageProvider } from "@/lib/storage";
import type { UploadInput } from "@/lib/storage";
import type {
  CreateGlobalSpecialityInput,
  ListGlobalSpecialitiesQuery,
  UpdateGlobalSpecialityInput,
} from "@/validators/global-speciality.validator";

export class GlobalSpecialityNotFoundError extends Error {
  constructor(id: number) {
    super(`Global speciality with id ${id} not found`);
    this.name = "GlobalSpecialityNotFoundError";
  }
}

/** Mirrors `GlobalSeoUrlCollisionError` in `global-treatment.service.ts` — see that file's own doc comment for why this check exists. */
export class GlobalSeoUrlCollisionError extends Error {
  constructor(seoUrl: string) {
    super(`The SEO URL "${seoUrl}" is already used by a global treatment — /dcg/${seoUrl} must be unique across global treatments and global specialities.`);
    this.name = "GlobalSeoUrlCollisionError";
  }
}

export type GlobalSpecialityImageInput = UploadInput;

const GLOBAL_SPECIALITY_UPLOAD_FOLDER = "global-specialities";

const globalSpecialitySelect = {
  id: true,
  speciality_name: true,
  speciality_title: true,
  seo_url: true,
  short_description: true,
  description: true,
  image: true,
  card_icon: true,
  meta_title: true,
  meta_description: true,
  meta_keyword: true,
  status: true,
  created_at: true,
  updated_at: true,
} as const;

async function ensureSeoUrlNotTakenByGlobalTreatment(seoUrl: string) {
  const clash = await prisma.global_treatments.findUnique({ where: { seo_url: seoUrl }, select: { id: true } });

  if (clash) {
    throw new GlobalSeoUrlCollisionError(seoUrl);
  }
}

export async function getGlobalSpecialities(filter?: ListGlobalSpecialitiesQuery) {
  const rows = await prisma.global_specialities.findMany({
    where: {
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: { ...globalSpecialitySelect, _count: { select: { specialities: true } } },
    orderBy: { id: "asc" },
  });

  return rows.map((row) => {
    const { _count, ...rest } = row;
    return { ...rest, linkedCityCount: _count.specialities };
  });
}

/**
 * Paginated, active-only listing for the nationwide `/specialities`
 * public page — mirrors `getGlobalTreatmentsPage()` exactly (see that
 * function's own doc comment for why this reads `global_specialities`
 * only, with no city join/fallback).
 */
export async function getGlobalSpecialitiesPage(options: { page: number; pageSize: number }) {
  const where = { status: "active" as const };

  const [rows, total] = await Promise.all([
    prisma.global_specialities.findMany({
      where,
      select: globalSpecialitySelect,
      orderBy: [{ speciality_name: "asc" }, { id: "asc" }],
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.global_specialities.count({ where }),
  ]);

  return { items: rows, total };
}

export async function getGlobalSpecialityById(id: number) {
  const row = await prisma.global_specialities.findUnique({
    where: { id },
    select: { ...globalSpecialitySelect, _count: { select: { specialities: true } } },
  });

  if (!row) {
    throw new GlobalSpecialityNotFoundError(id);
  }

  const { _count, ...rest } = row;
  return { ...rest, linkedCityCount: _count.specialities };
}

/** Public lookup by `seo_url` — reads ONLY `global_specialities`, never through any city `specialities` row. See `getGlobalTreatmentBySeoUrl`'s identical doc comment. */
export async function getGlobalSpecialityBySeoUrl(seoUrl: string) {
  const row = await prisma.global_specialities.findFirst({
    where: { seo_url: seoUrl, status: "active" },
    select: globalSpecialitySelect,
  });

  return row ?? null;
}

export async function createGlobalSpeciality(
  input: CreateGlobalSpecialityInput,
  image?: GlobalSpecialityImageInput,
  cardIcon?: GlobalSpecialityImageInput
) {
  const data = sanitizeHtmlFields(input, ["description"]);
  await ensureSeoUrlNotTakenByGlobalTreatment(data.seo_url);

  const imagePath = image ? await storageProvider.upload(image, GLOBAL_SPECIALITY_UPLOAD_FOLDER) : null;

  const cardIconPath = cardIcon
    ? await storageProvider.upload(cardIcon, GLOBAL_SPECIALITY_UPLOAD_FOLDER).catch(async (error) => {
        if (imagePath) await storageProvider.delete(imagePath).catch(() => undefined);
        throw error;
      })
    : null;

  try {
    return await prisma.global_specialities.create({
      data: { ...data, image: imagePath, card_icon: cardIconPath },
      select: globalSpecialitySelect,
    });
  } catch (error) {
    for (const path of [imagePath, cardIconPath]) {
      if (path) await storageProvider.delete(path).catch(() => undefined);
    }
    throw error;
  }
}

export async function updateGlobalSpeciality(
  id: number,
  input: UpdateGlobalSpecialityInput,
  image?: GlobalSpecialityImageInput | null,
  cardIcon?: GlobalSpecialityImageInput | null
) {
  const data = sanitizeHtmlFields(input, ["description"]);
  const current = await prisma.global_specialities.findUnique({ where: { id } });

  if (!current) {
    throw new GlobalSpecialityNotFoundError(id);
  }

  if (data.seo_url !== undefined && data.seo_url !== current.seo_url) {
    await ensureSeoUrlNotTakenByGlobalTreatment(data.seo_url);
  }

  let newImagePath: string | null | undefined;

  if (image === null) {
    newImagePath = null;
  } else if (image) {
    newImagePath = await storageProvider.upload(image, GLOBAL_SPECIALITY_UPLOAD_FOLDER);
  }

  // card_icon is this speciality's OWN column - independent of the hero image above.
  let newCardIconPath: string | null | undefined;

  if (cardIcon === null) {
    newCardIconPath = null;
  } else if (cardIcon) {
    try {
      newCardIconPath = await storageProvider.upload(cardIcon, GLOBAL_SPECIALITY_UPLOAD_FOLDER);
    } catch (error) {
      if (newImagePath) await storageProvider.delete(newImagePath).catch(() => undefined);
      throw error;
    }
  }

  try {
    const row = await prisma.global_specialities.update({
      where: { id },
      data: {
        ...data,
        ...(newImagePath !== undefined ? { image: newImagePath } : {}),
        ...(newCardIconPath !== undefined ? { card_icon: newCardIconPath } : {}),
        updated_at: new Date(),
      },
      select: globalSpecialitySelect,
    });

    if (newImagePath !== undefined && current.image) {
      await storageProvider.delete(current.image).catch((error) => {
        console.error("Failed to delete old global speciality image:", error);
      });
    }

    if (newCardIconPath !== undefined && current.card_icon) {
      await storageProvider.delete(current.card_icon).catch((error) => {
        console.error("Failed to delete old global speciality card icon:", error);
      });
    }

    return row;
  } catch (error) {
    for (const path of [newImagePath, newCardIconPath]) {
      if (path) {
        await storageProvider.delete(path).catch((cleanupError) => {
          console.error("Failed to clean up newly uploaded global speciality image after a failed update:", cleanupError);
        });
      }
    }

    throw error;
  }
}

export async function deleteGlobalSpeciality(id: number) {
  const current = await prisma.global_specialities.findUnique({ where: { id } });

  if (!current) {
    throw new GlobalSpecialityNotFoundError(id);
  }

  await prisma.global_specialities.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
