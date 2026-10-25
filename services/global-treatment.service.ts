import { prisma } from "@/lib/prisma";
import { sanitizeHtmlFields } from "@/lib/sanitize-html.server";
import { storageProvider } from "@/lib/storage";
import type { UploadInput } from "@/lib/storage";
import { GlobalSpecialityNotFoundError } from "@/services/global-speciality.service";
import type {
  CreateGlobalTreatmentInput,
  ListGlobalTreatmentsQuery,
  UpdateGlobalTreatmentInput,
} from "@/validators/global-treatment.validator";

export { GlobalSpecialityNotFoundError };

export class GlobalTreatmentNotFoundError extends Error {
  constructor(id: number) {
    super(`Global treatment with id ${id} not found`);
    this.name = "GlobalTreatmentNotFoundError";
  }
}

/**
 * `/dcg/{seoUrl}` is a namespace shared by `global_treatments` AND
 * `global_specialities` — two global treatments can never collide with
 * each other (the column's own `@unique` already guarantees that), but a
 * global treatment and a global speciality CAN independently pick the
 * same `seo_url` unless explicitly checked here, since they're different
 * tables. This is exactly that cross-table check.
 */
export class GlobalSeoUrlCollisionError extends Error {
  constructor(seoUrl: string) {
    super(`The SEO URL "${seoUrl}" is already used by a global speciality — /dcg/${seoUrl} must be unique across global treatments and global specialities.`);
    this.name = "GlobalSeoUrlCollisionError";
  }
}

export type GlobalTreatmentImageInput = UploadInput;

const GLOBAL_TREATMENT_UPLOAD_FOLDER = "global-treatments";

const globalTreatmentSelect = {
  id: true,
  treatment_name: true,
  treatment_title: true,
  seo_url: true,
  short_description: true,
  description: true,
  image: true,
  card_icon: true,
  meta_title: true,
  meta_description: true,
  meta_keyword: true,
  global_speciality_id: true,
  // Joined so callers (the public resolver, the admin listing table) can
  // build the nested `/dcg/{specialitySeoUrl}/{treatmentSeoUrl}` URL or
  // display which speciality this treatment is linked to without a
  // second query. `null` when `global_speciality_id` is null.
  global_specialities: {
    select: { id: true, seo_url: true, speciality_name: true, speciality_title: true, status: true },
  },
  status: true,
  created_at: true,
  updated_at: true,
} as const;

async function ensureSeoUrlNotTakenByGlobalSpeciality(seoUrl: string) {
  const clash = await prisma.global_specialities.findUnique({ where: { seo_url: seoUrl }, select: { id: true } });

  if (clash) {
    throw new GlobalSeoUrlCollisionError(seoUrl);
  }
}

async function ensureGlobalSpecialityExists(globalSpecialityId: number) {
  const globalSpeciality = await prisma.global_specialities.findUnique({
    where: { id: globalSpecialityId },
    select: { id: true },
  });

  if (!globalSpeciality) {
    throw new GlobalSpecialityNotFoundError(globalSpecialityId);
  }
}

export async function getGlobalTreatments(filter?: ListGlobalTreatmentsQuery) {
  const rows = await prisma.global_treatments.findMany({
    where: {
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
      ...(filter?.global_speciality_id !== undefined ? { global_speciality_id: filter.global_speciality_id } : {}),
    },
    select: { ...globalTreatmentSelect, _count: { select: { treatments: true } } },
    orderBy: { id: "asc" },
  });

  return rows.map((row) => {
    const { _count, ...rest } = row;
    return { ...rest, linkedCityCount: _count.treatments };
  });
}

/**
 * Paginated, active-only listing for the nationwide `/treatments` public
 * page — same `skip`/`take` + `count` shape as `blog.service.ts`'s
 * `getBlogsPage()`. Reads `global_treatments` ONLY: no join against the
 * city-scoped `treatments` table, no fallback, no "pick one city's row" —
 * the public listing must never derive its content from a city, same rule
 * `lib/public/global-content.ts` already enforces for the detail page.
 */
export async function getGlobalTreatmentsPage(options: { page: number; pageSize: number }) {
  const where = { status: "active" as const };

  const [rows, total] = await Promise.all([
    prisma.global_treatments.findMany({
      where,
      select: globalTreatmentSelect,
      orderBy: [{ treatment_name: "asc" }, { id: "asc" }],
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.global_treatments.count({ where }),
  ]);

  return { items: rows, total };
}

export async function getGlobalTreatmentById(id: number) {
  const row = await prisma.global_treatments.findUnique({
    where: { id },
    select: { ...globalTreatmentSelect, _count: { select: { treatments: true } } },
  });

  if (!row) {
    throw new GlobalTreatmentNotFoundError(id);
  }

  const { _count, ...rest } = row;
  return { ...rest, linkedCityCount: _count.treatments };
}

/**
 * Public lookup by `seo_url` — returns the active global treatment, or
 * `null` if none matches (never throws). Reads ONLY `global_treatments` —
 * never joins through any city `treatments` row, per the locked "global
 * content must never come from a city row" rule.
 */
export async function getGlobalTreatmentBySeoUrl(seoUrl: string) {
  const row = await prisma.global_treatments.findFirst({
    where: { seo_url: seoUrl, status: "active" },
    select: globalTreatmentSelect,
  });

  return row ?? null;
}

export async function createGlobalTreatment(
  input: CreateGlobalTreatmentInput,
  image?: GlobalTreatmentImageInput,
  cardIcon?: GlobalTreatmentImageInput
) {
  const data = sanitizeHtmlFields(input, ["description"]);
  await ensureSeoUrlNotTakenByGlobalSpeciality(data.seo_url);

  if (data.global_speciality_id != null) {
    await ensureGlobalSpecialityExists(data.global_speciality_id);
  }

  const imagePath = image ? await storageProvider.upload(image, GLOBAL_TREATMENT_UPLOAD_FOLDER) : null;
  const cardIconPath = cardIcon
    ? await storageProvider.upload(cardIcon, GLOBAL_TREATMENT_UPLOAD_FOLDER).catch(async (error) => {
        if (imagePath) await storageProvider.delete(imagePath).catch(() => undefined);
        throw error;
      })
    : null;

  try {
    return await prisma.global_treatments.create({
      data: { ...data, image: imagePath, card_icon: cardIconPath },
      select: globalTreatmentSelect,
    });
  } catch (error) {
    for (const path of [imagePath, cardIconPath]) {
      if (path) await storageProvider.delete(path).catch(() => undefined);
    }
    throw error;
  }
}

/** Same upload-then-write-then-best-effort-cleanup ordering as `updateTreatment`. */
export async function updateGlobalTreatment(
  id: number,
  input: UpdateGlobalTreatmentInput,
  image?: GlobalTreatmentImageInput | null,
  cardIcon?: GlobalTreatmentImageInput | null
) {
  const data = sanitizeHtmlFields(input, ["description"]);
  const current = await prisma.global_treatments.findUnique({ where: { id } });

  if (!current) {
    throw new GlobalTreatmentNotFoundError(id);
  }

  if (data.seo_url !== undefined && data.seo_url !== current.seo_url) {
    await ensureSeoUrlNotTakenByGlobalSpeciality(data.seo_url);
  }

  if (data.global_speciality_id != null) {
    await ensureGlobalSpecialityExists(data.global_speciality_id);
  }

  let newImagePath: string | null | undefined;

  if (image === null) {
    newImagePath = null;
  } else if (image) {
    newImagePath = await storageProvider.upload(image, GLOBAL_TREATMENT_UPLOAD_FOLDER);
  }

  // Same three-state semantics as `image` (upload / null = clear / undefined
  // = untouched), fully independent of it: the hero and the card icon never
  // read or write each other's column or stored file.
  let newCardIconPath: string | null | undefined;

  if (cardIcon === null) {
    newCardIconPath = null;
  } else if (cardIcon) {
    try {
      newCardIconPath = await storageProvider.upload(cardIcon, GLOBAL_TREATMENT_UPLOAD_FOLDER);
    } catch (error) {
      if (newImagePath) await storageProvider.delete(newImagePath).catch(() => undefined);
      throw error;
    }
  }

  try {
    const row = await prisma.global_treatments.update({
      where: { id },
      data: {
        ...data,
        ...(newImagePath !== undefined ? { image: newImagePath } : {}),
        ...(newCardIconPath !== undefined ? { card_icon: newCardIconPath } : {}),
        updated_at: new Date(),
      },
      select: globalTreatmentSelect,
    });

    if (newImagePath !== undefined && current.image) {
      await storageProvider.delete(current.image).catch((error) => {
        console.error("Failed to delete old global treatment image:", error);
      });
    }

    if (newCardIconPath !== undefined && current.card_icon) {
      await storageProvider.delete(current.card_icon).catch((error) => {
        console.error("Failed to delete old global treatment card icon:", error);
      });
    }

    return row;
  } catch (error) {
    for (const path of [newImagePath, newCardIconPath]) {
      if (path) {
        await storageProvider.delete(path).catch((cleanupError) => {
          console.error("Failed to clean up newly uploaded global treatment file after a failed update:", cleanupError);
        });
      }
    }

    throw error;
  }
}

/** Soft delete — same `status: "inactive"` convention as Treatment/Speciality. The image and any linked city rows (now pointing at an inactive global treatment) are preserved. */
export async function deleteGlobalTreatment(id: number) {
  const current = await prisma.global_treatments.findUnique({ where: { id } });

  if (!current) {
    throw new GlobalTreatmentNotFoundError(id);
  }

  await prisma.global_treatments.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
