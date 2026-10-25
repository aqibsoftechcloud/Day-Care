import { prisma } from "@/lib/prisma";
import { sanitizeHtmlFields } from "@/lib/sanitize-html.server";
import { storageProvider } from "@/lib/storage";
import type {
  CreateTreatmentInput,
  ListTreatmentsQuery,
  UpdateTreatmentInput,
} from "@/validators/treatment.validator";

export class TreatmentNotFoundError extends Error {
  constructor(id: number) {
    super(`Treatment with id ${id} not found`);
    this.name = "TreatmentNotFoundError";
  }
}

export class SpecialityNotFoundError extends Error {
  constructor(specialityId: number) {
    super(`Speciality with id ${specialityId} not found`);
    this.name = "SpecialityNotFoundError";
  }
}

export class LanguageNotFoundError extends Error {
  constructor(languageId: number) {
    super(`Language with id ${languageId} not found`);
    this.name = "LanguageNotFoundError";
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

export class LocationCityMismatchError extends Error {
  constructor(locationId: number, cityId: number) {
    super(
      `Location with id ${locationId} does not belong to city with id ${cityId}`
    );
    this.name = "LocationCityMismatchError";
  }
}

export class GlobalTreatmentNotFoundError extends Error {
  constructor(globalTreatmentId: number) {
    super(`Global treatment with id ${globalTreatmentId} not found`);
    this.name = "GlobalTreatmentNotFoundError";
  }
}

export type TreatmentImageInput = { buffer: Buffer; mimeType: string };

const TREATMENT_UPLOAD_FOLDER = "treatments";

const treatmentSelect = {
  id: true,
  speciality_id: true,
  sub_speciality_name: true,
  sub_speciality_title: true,
  seo_url: true,
  meta_title: true,
  meta_description: true,
  meta_keyword: true,
  language_id: true,
  city_id: true,
  location_id: true,
  hospital_id: true,
  speciality_logo: true,
  card_icon: true,
  short_description: true,
  keywords_for_doctors: true,
  status: true,
  ai_content_generator: true,
  description: true,
  created_at: true,
  updated_at: true,
  specialities: {
    select: {
      id: true,
      speciality_name: true,
      speciality_title: true,
      seo_url: true,
      doctor_speciality_id: true,
      cities: { select: { seo_url: true } },
    },
  },
  languages: { select: { id: true, name: true, seo_url: true } },
  cities: { select: { id: true, city_name: true, seo_url: true } },
  locations: {
    select: { id: true, area: true, zipcode: true, seo_url: true },
  },
  hospitals: { select: { id: true, hospital_name: true, seo_url: true } },
  // City -> Global discovery pointer only (see global_treatments' own doc
  // comment) — never a content source.
  global_treatment_id: true,
} as const;

type TreatmentRecord = {
  id: number;
  speciality_id: number;
  sub_speciality_name: string;
  sub_speciality_title: string | null;
  seo_url: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keyword: string | null;
  language_id: number;
  city_id: number;
  location_id: number | null;
  hospital_id: number | null;
  speciality_logo: string | null;
  card_icon: string | null;
  short_description: string | null;
  keywords_for_doctors: string | null;
  status: string;
  ai_content_generator: boolean;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  specialities: {
    id: number;
    speciality_name: string;
    speciality_title: string | null;
    seo_url: string;
    doctor_speciality_id: number | null;
    cities: { seo_url: string };
  };
  languages: { id: number; name: string; seo_url: string };
  cities: { id: number; city_name: string; seo_url: string };
  locations: {
    id: number;
    area: string;
    zipcode: string;
    seo_url: string;
  } | null;
  hospitals: { id: number; hospital_name: string; seo_url: string } | null;
  global_treatment_id: number | null;
};

function toSafeTreatment(treatment: TreatmentRecord) {
  const { specialities, languages, cities, locations, hospitals, ...rest } =
    treatment;

  return {
    ...rest,
    speciality: specialities,
    language: languages,
    city: cities,
    location: locations,
    hospital: hospitals,
  };
}

async function ensureSpecialityExists(specialityId: number) {
  const speciality = await prisma.specialities.findUnique({
    where: { id: specialityId },
  });

  if (!speciality) {
    throw new SpecialityNotFoundError(specialityId);
  }
}

async function ensureLanguageExists(languageId: number) {
  const language = await prisma.languages.findUnique({
    where: { id: languageId },
  });

  if (!language) {
    throw new LanguageNotFoundError(languageId);
  }
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

// Existence-only — an inactive global_treatments row is still a valid link.
async function ensureGlobalTreatmentExists(globalTreatmentId: number) {
  const globalTreatment = await prisma.global_treatments.findUnique({
    where: { id: globalTreatmentId },
  });

  if (!globalTreatment) {
    throw new GlobalTreatmentNotFoundError(globalTreatmentId);
  }
}

export async function getTreatments(filter?: ListTreatmentsQuery) {
  const treatments = await prisma.treatments.findMany({
    where: {
      ...(filter?.speciality_id !== undefined
        ? { speciality_id: filter.speciality_id }
        : {}),
      ...(filter?.language_id !== undefined
        ? { language_id: filter.language_id }
        : {}),
      ...(filter?.city_id !== undefined ? { city_id: filter.city_id } : {}),
      ...(filter?.location_id !== undefined
        ? { location_id: filter.location_id }
        : {}),
      ...(filter?.hospital_id !== undefined
        ? { hospital_id: filter.hospital_id }
        : {}),
      ...(filter?.global_treatment_id !== undefined
        ? { global_treatment_id: filter.global_treatment_id }
        : {}),
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: treatmentSelect,
    orderBy: { id: "asc" },
  });

  return treatments.map(toSafeTreatment);
}

export async function getTreatmentById(id: number) {
  const treatment = await prisma.treatments.findUnique({
    where: { id },
    select: treatmentSelect,
  });

  if (!treatment) {
    throw new TreatmentNotFoundError(id);
  }

  return toSafeTreatment(treatment);
}

/**
 * Public lookup by `seo_url` — returns the active treatment, or `null`
 * if no active treatment has this seo_url (never throws).
 */
export async function getTreatmentBySeoUrl(seoUrl: string) {
  const treatment = await prisma.treatments.findFirst({
    where: { seo_url: seoUrl, status: "active" },
    select: treatmentSelect,
  });

  return treatment ? toSafeTreatment(treatment) : null;
}

export async function createTreatment(
  input: CreateTreatmentInput,
  image?: TreatmentImageInput,
  cardIcon?: TreatmentImageInput
) {
  const data = sanitizeHtmlFields(input, ["description"]);
  await ensureSpecialityExists(data.speciality_id);
  await ensureLanguageExists(data.language_id);
  await ensureCityExists(data.city_id);

  if (data.hospital_id != null) {
    await ensureHospitalExists(data.hospital_id);
  }

  if (data.location_id != null) {
    await ensureLocationBelongsToCity(data.location_id, data.city_id);
  }

  if (data.global_treatment_id != null) {
    await ensureGlobalTreatmentExists(data.global_treatment_id);
  }

  const imagePath = image
    ? await storageProvider.upload(image, TREATMENT_UPLOAD_FOLDER)
    : null;

  const cardIconPath = cardIcon
    ? await storageProvider
        .upload(cardIcon, TREATMENT_UPLOAD_FOLDER)
        .catch(async (error) => {
          if (imagePath) await storageProvider.delete(imagePath).catch(() => undefined);
          throw error;
        })
    : null;

  try {
    const treatment = await prisma.treatments.create({
      data: { ...data, speciality_logo: imagePath, card_icon: cardIconPath },
      select: treatmentSelect,
    });

    return toSafeTreatment(treatment);
  } catch (error) {
    for (const path of [imagePath, cardIconPath]) {
      if (path) await storageProvider.delete(path).catch(() => undefined);
    }
    throw error;
  }
}

/**
 * Update ordering for image replacement: a new image is uploaded first,
 * then the DB is updated; the OLD image is only deleted once that DB
 * update has succeeded (best-effort — a cleanup failure doesn't fail the
 * request). If the DB update itself fails, the newly uploaded file is
 * best-effort cleaned up instead, so a failed update never leaves an
 * orphaned new file behind nor a record pointing at a deleted image.
 */
export async function updateTreatment(
  id: number,
  input: UpdateTreatmentInput,
  image?: TreatmentImageInput,
  cardIcon?: TreatmentImageInput | null
) {
  const data = sanitizeHtmlFields(input, ["description"]);
  const current = await prisma.treatments.findUnique({ where: { id } });

  if (!current) {
    throw new TreatmentNotFoundError(id);
  }

  if (data.speciality_id !== undefined) {
    await ensureSpecialityExists(data.speciality_id);
  }

  if (data.language_id !== undefined) {
    await ensureLanguageExists(data.language_id);
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

  if (data.global_treatment_id !== undefined && data.global_treatment_id !== null) {
    await ensureGlobalTreatmentExists(data.global_treatment_id);
  }

  let newImagePath: string | undefined;

  if (image) {
    newImagePath = await storageProvider.upload(
      image,
      TREATMENT_UPLOAD_FOLDER
    );
  }

  // `card_icon` is this city treatment's OWN column — independent of
  // `speciality_logo` (hero) and never read from / written to the linked
  // `global_treatments` row. Upload / null = clear / undefined = untouched.
  let newCardIconPath: string | null | undefined;

  if (cardIcon === null) {
    newCardIconPath = null;
  } else if (cardIcon) {
    try {
      newCardIconPath = await storageProvider.upload(cardIcon, TREATMENT_UPLOAD_FOLDER);
    } catch (error) {
      if (newImagePath) await storageProvider.delete(newImagePath).catch(() => undefined);
      throw error;
    }
  }

  try {
    const treatment = await prisma.treatments.update({
      where: { id },
      data: {
        ...data,
        ...(newImagePath !== undefined
          ? { speciality_logo: newImagePath }
          : {}),
        ...(newCardIconPath !== undefined ? { card_icon: newCardIconPath } : {}),
        updated_at: new Date(),
      },
      select: treatmentSelect,
    });

    if (newCardIconPath !== undefined && current.card_icon) {
      await storageProvider
        .delete(current.card_icon)
        .catch((error) => console.error("Failed to delete old treatment card icon:", error));
    }

    if (newImagePath !== undefined && current.speciality_logo) {
      await storageProvider
        .delete(current.speciality_logo)
        .catch((error) =>
          console.error("Failed to delete old treatment image:", error)
        );
    }

    return toSafeTreatment(treatment);
  } catch (error) {
    for (const path of [newImagePath, newCardIconPath]) {
      if (path) {
        await storageProvider
          .delete(path)
          .catch((cleanupError) =>
            console.error(
              "Failed to clean up newly uploaded treatment file after a failed update:",
              cleanupError
            )
          );
      }
    }

    throw error;
  }
}

/**
 * Soft delete: deactivates the treatment by setting status to "inactive".
 * Idempotent — deactivating an already-inactive treatment succeeds the
 * same way, matching the convention used by every other module. The
 * image is intentionally preserved (not deleted).
 */
export async function deleteTreatment(id: number) {
  const current = await prisma.treatments.findUnique({ where: { id } });

  if (!current) {
    throw new TreatmentNotFoundError(id);
  }

  await prisma.treatments.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
