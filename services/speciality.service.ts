import { prisma } from "@/lib/prisma";
import { sanitizeHtmlFields } from "@/lib/sanitize-html.server";
import { storageProvider } from "@/lib/storage";
import { UnsupportedFileTypeError } from "@/lib/upload";
import type {
  CreateSpecialityInput,
  ListSpecialitiesQuery,
  UpdateSpecialityInput,
} from "@/validators/speciality.validator";

const SPECIALITY_LOGO_UPLOAD_FOLDER = "specialities";

// Narrower than lib/upload's shared ALLOWED_IMAGE_MIME_TYPES (which also
// permits GIF) — Speciality Logo is a small brand/identity mark, not a
// photo, so only JPG/PNG/WEBP are accepted here. Reuses the same
// UnsupportedFileTypeError the shared multer layer already throws, so the
// controller's existing error handling covers this without a new case.
const SPECIALITY_LOGO_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type SpecialityImageInput = { buffer: Buffer; mimeType: string };

function ensureValidSpecialityLogo(image: SpecialityImageInput) {
  if (!SPECIALITY_LOGO_ALLOWED_MIME_TYPES.includes(image.mimeType)) {
    throw new UnsupportedFileTypeError(image.mimeType);
  }
}

export class SpecialityNotFoundError extends Error {
  constructor(id: number) {
    super(`Speciality with id ${id} not found`);
    this.name = "SpecialityNotFoundError";
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

export class HospitalNotFoundError extends Error {
  constructor(hospitalId: number) {
    super(`Hospital with id ${hospitalId} not found`);
    this.name = "HospitalNotFoundError";
  }
}

export class ParentSpecialityNotFoundError extends Error {
  constructor(parentId: number) {
    super(`Parent speciality with id ${parentId} not found`);
    this.name = "ParentSpecialityNotFoundError";
  }
}

export class DoctorSpecialityNotFoundError extends Error {
  constructor(doctorSpecialityId: number) {
    super(`Doctor speciality with id ${doctorSpecialityId} not found`);
    this.name = "DoctorSpecialityNotFoundError";
  }
}

export class GlobalSpecialityNotFoundError extends Error {
  constructor(globalSpecialityId: number) {
    super(`Global speciality with id ${globalSpecialityId} not found`);
    this.name = "GlobalSpecialityNotFoundError";
  }
}

export class InvalidParentSpecialityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidParentSpecialityError";
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

export class SpecialityHasActiveChildrenError extends Error {
  constructor(id: number) {
    super(
      `Speciality with id ${id} has active child specialities and cannot be deactivated until they are reassigned or deactivated first`
    );
    this.name = "SpecialityHasActiveChildrenError";
  }
}

const specialitySelect = {
  id: true,
  speciality_name: true,
  speciality_title: true,
  seo_url: true,
  meta_title: true,
  meta_description: true,
  meta_keyword: true,
  city_id: true,
  location_id: true,
  hospital_id: true,
  speciality_logo: true,
  card_icon: true,
  short_description: true,
  parent_speciality_id: true,
  keywords_for_doctors: true,
  status: true,
  ai_content_generator: true,
  description: true,
  created_at: true,
  updated_at: true,
  // `seo_url` is included on `cities` (unlike the rest of this select's
  // pre-existing shape) because the future public city-prefixed route
  // needs it to validate the URL's city segment against this row's
  // actual city — see lib/public/root-resolver.ts and the locked URL
  // architecture's city-validation/redirect rule.
  cities: { select: { id: true, city_name: true, seo_url: true } },
  locations: { select: { id: true, area: true, zipcode: true } },
  // `status`/`cities` added for the public speciality-detail page's
  // "linked hospital" section (lib/public/specialities.ts) — it needs to
  // skip an inactive-hospital edge case and build the hospital's own
  // canonical URL, which requires the hospital's own city seo_url (not
  // assumed to match the speciality's city).
  hospitals: {
    select: {
      id: true,
      hospital_name: true,
      seo_url: true,
      status: true,
      cities: { select: { seo_url: true } },
    },
  },
  specialities: {
    select: {
      id: true,
      speciality_name: true,
      speciality_title: true,
      seo_url: true,
    },
  },
  doctor_speciality_id: true,
  // Added for the public Speciality Doctors section (lib/public/specialities.ts)
  // — the nationwide doctor_specialities taxonomy row this clinical
  // speciality is optionally linked to, used to look up doctors mapped to
  // that taxonomy id via doctor_speciality_mappings.
  doctor_specialities: {
    select: { id: true, speciality_name: true, seo_url: true, status: true },
  },
  // City -> Global discovery pointer only (see global_specialities' own
  // doc comment) — never a content source. Plain scalar FK, same
  // treatment as doctor_speciality_id.
  global_speciality_id: true,
} as const;

type SpecialityRecord = {
  id: number;
  speciality_name: string;
  speciality_title: string | null;
  seo_url: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keyword: string | null;
  city_id: number;
  location_id: number | null;
  hospital_id: number | null;
  speciality_logo: string | null;
  card_icon: string | null;
  short_description: string | null;
  parent_speciality_id: number | null;
  keywords_for_doctors: string | null;
  status: string;
  ai_content_generator: boolean;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  cities: { id: number; city_name: string; seo_url: string };
  locations: { id: number; area: string; zipcode: string } | null;
  hospitals: {
    id: number;
    hospital_name: string;
    seo_url: string;
    status: string;
    cities: { seo_url: string };
  } | null;
  specialities: {
    id: number;
    speciality_name: string;
    speciality_title: string | null;
    seo_url: string;
  } | null;
  doctor_speciality_id: number | null;
  doctor_specialities: { id: number; speciality_name: string; seo_url: string; status: string } | null;
  global_speciality_id: number | null;
};

function toSafeSpeciality(speciality: SpecialityRecord) {
  const { cities, locations, hospitals, specialities, doctor_specialities, ...rest } = speciality;

  return {
    ...rest,
    city: cities,
    location: locations,
    hospital: hospitals,
    parent: specialities,
    doctorSpeciality: doctor_specialities,
  };
}

async function ensureCityExists(cityId: number) {
  const city = await prisma.cities.findUnique({ where: { id: cityId } });

  if (!city) {
    throw new CityNotFoundError(cityId);
  }
}

async function ensureHospitalExists(hospitalId: number) {
  const hospital = await prisma.hospitals.findUnique({
    where: { id: hospitalId },
  });

  if (!hospital) {
    throw new HospitalNotFoundError(hospitalId);
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

async function ensureParentExists(parentId: number) {
  const parent = await prisma.specialities.findUnique({
    where: { id: parentId },
  });

  if (!parent) {
    throw new ParentSpecialityNotFoundError(parentId);
  }
}

// Existence-only, same convention as ensureHospitalExists/ensureParentExists
// — an inactive doctor_specialities row is still a valid link (mirrors
// hospital_id, which likewise doesn't require the hospital to be active).
async function ensureDoctorSpecialityExists(doctorSpecialityId: number) {
  const doctorSpeciality = await prisma.doctor_specialities.findUnique({
    where: { id: doctorSpecialityId },
  });

  if (!doctorSpeciality) {
    throw new DoctorSpecialityNotFoundError(doctorSpecialityId);
  }
}

// Existence-only — same convention as ensureDoctorSpecialityExists. An
// inactive global_specialities row is still a valid link (an admin may
// deliberately link ahead of publishing the global page).
async function ensureGlobalSpecialityExists(globalSpecialityId: number) {
  const globalSpeciality = await prisma.global_specialities.findUnique({
    where: { id: globalSpecialityId },
  });

  if (!globalSpeciality) {
    throw new GlobalSpecialityNotFoundError(globalSpecialityId);
  }
}

/**
 * Walks the proposed parent's ancestor chain to make sure `id` does not
 * appear in it, which would otherwise create a circular hierarchy.
 */
async function ensureNoCycle(id: number, parentId: number) {
  if (parentId === id) {
    throw new InvalidParentSpecialityError(
      "A speciality cannot be its own parent"
    );
  }

  let currentId: number | null = parentId;
  const visited = new Set<number>();

  while (currentId !== null) {
    if (currentId === id) {
      throw new InvalidParentSpecialityError(
        "Invalid parent: this would create a circular speciality hierarchy"
      );
    }

    if (visited.has(currentId)) break;
    visited.add(currentId);

    const current: { parent_speciality_id: number | null } | null =
      await prisma.specialities.findUnique({
        where: { id: currentId },
        select: { parent_speciality_id: true },
      });

    currentId = current?.parent_speciality_id ?? null;
  }
}

async function ensureNoActiveChildren(id: number) {
  const activeChild = await prisma.specialities.findFirst({
    where: { parent_speciality_id: id, status: "active" },
    select: { id: true },
  });

  if (activeChild) {
    throw new SpecialityHasActiveChildrenError(id);
  }
}

export async function getSpecialities(filter?: ListSpecialitiesQuery) {
  const specialities = await prisma.specialities.findMany({
    where: {
      ...(filter?.city_id !== undefined ? { city_id: filter.city_id } : {}),
      ...(filter?.location_id !== undefined
        ? { location_id: filter.location_id }
        : {}),
      ...(filter?.hospital_id !== undefined
        ? { hospital_id: filter.hospital_id }
        : {}),
      ...(filter?.parent_speciality_id !== undefined
        ? { parent_speciality_id: filter.parent_speciality_id }
        : {}),
      ...(filter?.global_speciality_id !== undefined
        ? { global_speciality_id: filter.global_speciality_id }
        : {}),
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: specialitySelect,
    orderBy: { id: "asc" },
  });

  return specialities.map(toSafeSpeciality);
}

export async function getSpecialityById(id: number) {
  const speciality = await prisma.specialities.findUnique({
    where: { id },
    select: specialitySelect,
  });

  if (!speciality) {
    throw new SpecialityNotFoundError(id);
  }

  return toSafeSpeciality(speciality);
}

/**
 * Public lookup by `seo_url` — returns the active speciality, or `null`
 * if no active speciality has this seo_url (never throws). The row's own
 * `city` relation (already included) is what the future public route
 * validates the URL's city segment against.
 */
export async function getSpecialityBySeoUrl(seoUrl: string) {
  const speciality = await prisma.specialities.findFirst({
    where: { seo_url: seoUrl, status: "active" },
    select: specialitySelect,
  });

  return speciality ? toSafeSpeciality(speciality) : null;
}

export async function createSpeciality(
  input: CreateSpecialityInput,
  image?: SpecialityImageInput,
  cardIcon?: SpecialityImageInput
) {
  const data = sanitizeHtmlFields(input, ["description"]);
  await ensureCityExists(data.city_id);

  if (data.hospital_id != null) {
    await ensureHospitalExists(data.hospital_id);
  }

  if (data.location_id != null) {
    await ensureLocationBelongsToCity(data.location_id, data.city_id);
  }

  if (data.parent_speciality_id != null) {
    await ensureParentExists(data.parent_speciality_id);
  }

  if (data.doctor_speciality_id != null) {
    await ensureDoctorSpecialityExists(data.doctor_speciality_id);
  }

  if (data.global_speciality_id != null) {
    await ensureGlobalSpecialityExists(data.global_speciality_id);
  }

  if (image) {
    ensureValidSpecialityLogo(image);
  }

  const imagePath = image
    ? await storageProvider.upload(image, SPECIALITY_LOGO_UPLOAD_FOLDER)
    : null;

  const cardIconPath = cardIcon
    ? await storageProvider.upload(cardIcon, SPECIALITY_LOGO_UPLOAD_FOLDER).catch(async (error) => {
        if (imagePath) await storageProvider.delete(imagePath).catch(() => undefined);
        throw error;
      })
    : null;

  try {
    const speciality = await prisma.specialities.create({
      data: { ...data, speciality_logo: imagePath, card_icon: cardIconPath },
      select: specialitySelect,
    });

    return toSafeSpeciality(speciality);
  } catch (error) {
    for (const path of [imagePath, cardIconPath]) {
      if (path) await storageProvider.delete(path).catch(() => undefined);
    }
    throw error;
  }
}

/**
 * Update ordering for logo replacement (safer than naive "delete old, then
 * write new"): a new logo is uploaded first, then the DB is updated; the
 * OLD logo is only deleted once that DB update has succeeded (best-effort).
 * If the DB update fails, the newly uploaded file is best-effort cleaned up
 * instead. Mirrors services/doctor.service.ts's updateDoctor() exactly.
 *
 * The `image` parameter has three distinct states:
 * - `undefined`: no change — the existing logo is preserved.
 * - `null`: an explicit clear (the admin clicked "Remove") — the DB field
 *   is set to NULL, and the old file is deleted (best-effort) only after
 *   that update succeeds.
 * - a real file: replace — validate, upload, update, then delete the old
 *   file.
 */
export async function updateSpeciality(
  id: number,
  input: UpdateSpecialityInput,
  image?: SpecialityImageInput | null,
  cardIcon?: SpecialityImageInput | null
) {
  const data = sanitizeHtmlFields(input, ["description"]);
  const current = await prisma.specialities.findUnique({ where: { id } });

  if (!current) {
    throw new SpecialityNotFoundError(id);
  }

  if (data.city_id !== undefined) {
    await ensureCityExists(data.city_id);
  }

  if (data.hospital_id !== undefined && data.hospital_id !== null) {
    await ensureHospitalExists(data.hospital_id);
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

  if (data.parent_speciality_id !== undefined) {
    if (data.parent_speciality_id !== null) {
      await ensureParentExists(data.parent_speciality_id);
      await ensureNoCycle(id, data.parent_speciality_id);
    }
  }

  if (data.doctor_speciality_id !== undefined && data.doctor_speciality_id !== null) {
    await ensureDoctorSpecialityExists(data.doctor_speciality_id);
  }

  if (data.global_speciality_id !== undefined && data.global_speciality_id !== null) {
    await ensureGlobalSpecialityExists(data.global_speciality_id);
  }

  let newLogoPath: string | null | undefined;

  if (image === null) {
    newLogoPath = null;
  } else if (image) {
    ensureValidSpecialityLogo(image);
    newLogoPath = await storageProvider.upload(image, SPECIALITY_LOGO_UPLOAD_FOLDER);
  }

  // card_icon is this speciality's OWN column - independent of the hero logo above.
  let newCardIconPath: string | null | undefined;

  if (cardIcon === null) {
    newCardIconPath = null;
  } else if (cardIcon) {
    try {
      newCardIconPath = await storageProvider.upload(cardIcon, SPECIALITY_LOGO_UPLOAD_FOLDER);
    } catch (error) {
      if (newLogoPath) await storageProvider.delete(newLogoPath).catch(() => undefined);
      throw error;
    }
  }

  try {
    const speciality = await prisma.specialities.update({
      where: { id },
      data: {
        ...data,
        ...(newLogoPath !== undefined ? { speciality_logo: newLogoPath } : {}),
        ...(newCardIconPath !== undefined ? { card_icon: newCardIconPath } : {}),
        updated_at: new Date(),
      },
      select: specialitySelect,
    });

    if (newLogoPath !== undefined && current.speciality_logo) {
      await storageProvider
        .delete(current.speciality_logo)
        .catch((error) => console.error("Failed to delete old speciality logo:", error));
    }

    if (newCardIconPath !== undefined && current.card_icon) {
      await storageProvider
        .delete(current.card_icon)
        .catch((error) => console.error("Failed to delete old speciality card icon:", error));
    }

    return toSafeSpeciality(speciality);
  } catch (error) {
    for (const path of [newLogoPath, newCardIconPath]) {
      if (path) {
        await storageProvider
          .delete(path)
          .catch((cleanupError) =>
            console.error("Failed to clean up newly uploaded speciality image after a failed update:", cleanupError)
          );
      }
    }

    throw error;
  }
}

/**
 * Soft delete: deactivates the speciality by setting status to "inactive".
 * Refuses to deactivate a speciality that still has active children, to
 * avoid silently orphaning them under an inactive parent — the caller
 * must reassign or deactivate the children first.
 */
export async function deleteSpeciality(id: number) {
  const current = await prisma.specialities.findUnique({ where: { id } });

  if (!current) {
    throw new SpecialityNotFoundError(id);
  }

  await ensureNoActiveChildren(id);

  await prisma.specialities.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
