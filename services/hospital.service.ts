import { prisma } from "@/lib/prisma";
import { sanitizeHtmlFields } from "@/lib/sanitize-html.server";
import { Prisma } from "@/app/generated/prisma/client";
import { storageProvider } from "@/lib/storage";
import type {
  CreateHospitalInput,
  ListHospitalsQuery,
  UpdateHospitalInput,
} from "@/validators/hospital.validator";

export type HospitalImageInput = { buffer: Buffer; mimeType: string };

const HOSPITAL_UPLOAD_FOLDER = "hospitals";

export class HospitalNotFoundError extends Error {
  constructor(id: number) {
    super(`Hospital with id ${id} not found`);
    this.name = "HospitalNotFoundError";
  }
}

export class CityNotFoundError extends Error {
  constructor(cityId: number) {
    super(`City with id ${cityId} not found`);
    this.name = "CityNotFoundError";
  }
}

export class LocationNotFoundError extends Error {
  constructor(locationId: number) {
    super(`Location with id ${locationId} not found`);
    this.name = "LocationNotFoundError";
  }
}

export class LocationCityMismatchError extends Error {
  constructor(locationId: number, cityId: number) {
    super(
      `Location with id ${locationId} does not belong to city with id ${cityId}`
    );
    this.name = "LocationCityMismatchError";
  }
}

const hospitalSelect = {
  id: true,
  hospital_name: true,
  city_id: true,
  location_id: true,
  meta_title: true,
  meta_description: true,
  meta_keywords: true,
  seo_url: true,
  phone_number: true,
  timings: true,
  address: true,
  hospital_image: true,
  google_reviews: true,
  patient_satisfaction_score: true,
  location_360_view: true,
  location_map: true,
  hospital_description: true,
  long_description: true,
  hospital_gallery: true,
  status: true,
  created_at: true,
  updated_at: true,
  // `seo_url` is included on `cities` so the future public city-prefixed
  // route can validate the URL's city segment against this row's actual
  // city — see lib/public/root-resolver.ts and the locked URL
  // architecture's city-validation/redirect rule.
  cities: { select: { id: true, city_name: true, seo_url: true } },
  locations: { select: { id: true, area: true, zipcode: true } },
} as const;

async function ensureCityExists(cityId: number) {
  const city = await prisma.cities.findUnique({ where: { id: cityId } });

  if (!city) {
    throw new CityNotFoundError(cityId);
  }
}

async function ensureLocationBelongsToCity(
  locationId: number,
  cityId: number
) {
  const location = await prisma.locations.findUnique({
    where: { id: locationId },
  });

  if (!location) {
    throw new LocationNotFoundError(locationId);
  }

  if (location.city_id !== cityId) {
    throw new LocationCityMismatchError(locationId, cityId);
  }
}

/**
 * `hospital_gallery` is a nullable Prisma Json field. Prisma requires the
 * explicit `Prisma.DbNull` sentinel to clear a nullable Json column to SQL
 * NULL — a plain JS `null` is not accepted for that field. Any other value
 * (already guaranteed JSON-safe, since it came from request.json()) passes
 * through untouched; `undefined` means "leave this field unchanged".
 */
function toHospitalGalleryInput(value: unknown) {
  if (value === null) {
    return Prisma.DbNull;
  }

  return value as Prisma.InputJsonValue;
}

export function getHospitals(filter?: ListHospitalsQuery) {
  return prisma.hospitals.findMany({
    where: {
      ...(filter?.city_id !== undefined ? { city_id: filter.city_id } : {}),
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: hospitalSelect,
    orderBy: { id: "asc" },
  });
}

/**
 * Paginated, active-only hospital listing for the nationwide `/hospitals`
 * public page — same `skip`/`take` + `count` shape as `blog.service.ts`'s
 * `getBlogsPage()`, kept separate from `getHospitals()` (still used
 * unpaginated by the admin table and the per-city listing). No `city_id`
 * filter: this listing is nationwide by design.
 */
export async function getHospitalsPage(options: { page: number; pageSize: number }) {
  const where = { status: "active" as const };

  const [rows, total] = await Promise.all([
    prisma.hospitals.findMany({
      where,
      select: hospitalSelect,
      orderBy: [{ hospital_name: "asc" }, { id: "asc" }],
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.hospitals.count({ where }),
  ]);

  return { items: rows, total };
}

export async function getHospitalById(id: number) {
  const hospital = await prisma.hospitals.findUnique({
    where: { id },
    select: hospitalSelect,
  });

  if (!hospital) {
    throw new HospitalNotFoundError(id);
  }

  return hospital;
}

/**
 * Public lookup by `seo_url` — returns the active hospital, or `null` if
 * no active hospital has this seo_url (never throws).
 */
export async function getHospitalBySeoUrl(seoUrl: string) {
  return prisma.hospitals.findFirst({
    where: { seo_url: seoUrl, status: "active" },
    select: hospitalSelect,
  });
}

/**
 * `image`, when provided, is uploaded and its stored path overrides
 * `data.hospital_image` — same "real upload wins over a pasted URL
 * string" convention `gallery.service.ts`'s `createGalleryItem` uses.
 * `hospital_image` stays the one column either way: an admin can still
 * paste an external URL directly (unchanged, pre-existing behavior) when
 * no file is uploaded.
 */
export async function createHospital(input: CreateHospitalInput, image?: HospitalImageInput) {
  const data = sanitizeHtmlFields(input, ["long_description"]);
  await ensureCityExists(data.city_id);

  if (data.location_id != null) {
    await ensureLocationBelongsToCity(data.location_id, data.city_id);
  }

  const { hospital_gallery, ...rest } = data;
  const imagePath = image ? await storageProvider.upload(image, HOSPITAL_UPLOAD_FOLDER) : undefined;

  return prisma.hospitals.create({
    data: {
      ...rest,
      ...(imagePath !== undefined ? { hospital_image: imagePath } : {}),
      ...(hospital_gallery !== undefined
        ? { hospital_gallery: toHospitalGalleryInput(hospital_gallery) }
        : {}),
    },
    select: hospitalSelect,
  });
}

/**
 * Same image-replace ordering as `updateTreatment`: a new image is
 * uploaded first, the DB update only happens after that succeeds, and
 * the OLD image is deleted only once the DB update has succeeded
 * (best-effort cleanup — a failure there doesn't fail the request). Only
 * deletes the old value when it looks like one of our own local uploads
 * (starts with "/") — never attempts to "delete" an admin-pasted
 * external URL. If the DB update itself fails, the newly uploaded file
 * is best-effort cleaned up instead.
 */
export async function updateHospital(id: number, input: UpdateHospitalInput, image?: HospitalImageInput) {
  const data = sanitizeHtmlFields(input, ["long_description"]);
  const current = await prisma.hospitals.findUnique({ where: { id } });

  if (!current) {
    throw new HospitalNotFoundError(id);
  }

  if (data.city_id !== undefined) {
    await ensureCityExists(data.city_id);
  }

  const effectiveCityId =
    data.city_id !== undefined ? data.city_id : current.city_id;

  if (data.location_id !== undefined) {
    // location_id explicitly supplied (a number, or null to clear it)
    if (data.location_id !== null) {
      await ensureLocationBelongsToCity(data.location_id, effectiveCityId);
    }
  } else if (data.city_id !== undefined && current.location_id !== null) {
    // city changed, location left unchanged -> re-validate against the new city
    await ensureLocationBelongsToCity(current.location_id, effectiveCityId);
  }

  const { hospital_gallery, ...rest } = data;

  let newImagePath: string | undefined;
  if (image) {
    newImagePath = await storageProvider.upload(image, HOSPITAL_UPLOAD_FOLDER);
  }

  try {
    const hospital = await prisma.hospitals.update({
      where: { id },
      data: {
        ...rest,
        ...(newImagePath !== undefined ? { hospital_image: newImagePath } : {}),
        ...(hospital_gallery !== undefined
          ? { hospital_gallery: toHospitalGalleryInput(hospital_gallery) }
          : {}),
        updated_at: new Date(),
      },
      select: hospitalSelect,
    });

    if (newImagePath !== undefined && current.hospital_image?.startsWith("/")) {
      await storageProvider.delete(current.hospital_image).catch((cleanupError) => {
        console.error("Failed to clean up previous hospital image after update:", cleanupError);
      });
    }

    return hospital;
  } catch (error) {
    if (newImagePath !== undefined) {
      await storageProvider.delete(newImagePath).catch((cleanupError) => {
        console.error("Failed to clean up newly uploaded hospital image after a failed update:", cleanupError);
      });
    }

    throw error;
  }
}

/**
 * Soft delete: deactivates the hospital by setting status to "inactive".
 */
export async function deleteHospital(id: number) {
  const current = await prisma.hospitals.findUnique({ where: { id } });

  if (!current) {
    throw new HospitalNotFoundError(id);
  }

  await prisma.hospitals.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
