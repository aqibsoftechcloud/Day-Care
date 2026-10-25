import { prisma } from "@/lib/prisma";
import { sanitizeOptionalHtml } from "@/lib/sanitize-html.server";
import { Prisma } from "@/app/generated/prisma/client";
import { storageProvider } from "@/lib/storage";
import type {
  CreateDoctorInput,
  ListDoctorsQuery,
  UpdateDoctorInput,
} from "@/validators/doctor.validator";

export class DoctorNotFoundError extends Error {
  constructor(id: number) {
    super(`Doctor with id ${id} not found`);
    this.name = "DoctorNotFoundError";
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

export class LocationCityMismatchError extends Error {
  constructor(locationId: number, cityId: number) {
    super(
      `Location with id ${locationId} does not belong to city with id ${cityId}`
    );
    this.name = "LocationCityMismatchError";
  }
}

export type DoctorImageInput = { buffer: Buffer; mimeType: string };

const DOCTOR_UPLOAD_FOLDER = "doctors";

const doctorSelect = {
  id: true,
  language_id: true,
  doctor_name: true,
  meta_title: true,
  seo_url: true,
  meta_description: true,
  meta_keywords: true,
  qualification: true,
  experience: true,
  availability: true,
  city_id: true,
  location_id: true,
  patient_satisfaction_score: true,
  sorting_order: true,
  doctor_image: true,
  mon_sat_first_timings: true,
  mon_sat_second_timings: true,
  sunday_timings: true,
  time_interval: true,
  location_map: true,
  doctor_description: true,
  ai_content_generator: true,
  doc_info: true,
  schema_tags: true,
  latitude: true,
  longitude: true,
  status: true,
  created_at: true,
  updated_at: true,
  languages: { select: { id: true, name: true, seo_url: true } },
  cities: { select: { id: true, city_name: true, seo_url: true } },
  locations: {
    select: { id: true, area: true, zipcode: true, seo_url: true },
  },
} as const;

type DoctorRecord = {
  id: number;
  language_id: number;
  doctor_name: string;
  meta_title: string | null;
  seo_url: string;
  meta_description: string | null;
  meta_keywords: string | null;
  qualification: string | null;
  experience: string | null;
  availability: string | null;
  city_id: number;
  location_id: number | null;
  patient_satisfaction_score: Prisma.Decimal | null;
  sorting_order: number;
  doctor_image: string | null;
  mon_sat_first_timings: string | null;
  mon_sat_second_timings: string | null;
  sunday_timings: string | null;
  time_interval: string | null;
  location_map: string | null;
  doctor_description: string | null;
  ai_content_generator: boolean;
  doc_info: string | null;
  schema_tags: Prisma.JsonValue;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  status: string;
  created_at: Date;
  updated_at: Date;
  languages: { id: number; name: string; seo_url: string };
  cities: { id: number; city_name: string; seo_url: string };
  locations: {
    id: number;
    area: string;
    zipcode: string;
    seo_url: string;
  } | null;
};

function toSafeDoctor(doctor: DoctorRecord) {
  const { languages, cities, locations, ...rest } = doctor;

  return {
    ...rest,
    language: languages,
    city: cities,
    location: locations,
  };
}

/**
 * `schema_tags` is a nullable Prisma Json field. Prisma requires the
 * explicit `Prisma.DbNull` sentinel to clear a nullable Json column to SQL
 * NULL — a plain JS `null` is not accepted for that field. Any other value
 * (already parsed/validated as JSON by the validator) passes through
 * untouched; `undefined` means "leave this field unchanged".
 */
function toSchemaTagsInput(value: unknown) {
  if (value === null) {
    return Prisma.DbNull;
  }

  return value as Prisma.InputJsonValue;
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

export async function getDoctors(filter?: ListDoctorsQuery) {
  const doctors = await prisma.doctors.findMany({
    where: {
      ...(filter?.language_id !== undefined
        ? { language_id: filter.language_id }
        : {}),
      ...(filter?.city_id !== undefined ? { city_id: filter.city_id } : {}),
      ...(filter?.location_id !== undefined
        ? { location_id: filter.location_id }
        : {}),
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: doctorSelect,
    orderBy: [{ sorting_order: "asc" }, { id: "asc" }],
  });

  return doctors.map(toSafeDoctor);
}

/**
 * Paginated, active-only doctor listing for the nationwide `/doctors`
 * public page — same `skip`/`take` + `count` shape as `blog.service.ts`'s
 * `getBlogsPage()`, kept separate from `getDoctors()` (which the admin
 * table and every other caller still use unpaginated) rather than adding
 * pagination params to a shared function.
 *
 * `city_id`/`doctor_speciality_id`/`search` are all OPTIONAL narrowing
 * filters, not a change to the listing's fundamental scope: omitting all
 * three still returns every active doctor nationwide, exactly as before
 * — this is the global directory, never implicitly scoped to a city.
 */
export async function getDoctorsPage(options: {
  page: number;
  pageSize: number;
  search?: string;
  city_id?: number;
  doctor_speciality_id?: number;
}) {
  const where = {
    status: "active" as const,
    ...(options.search ? { doctor_name: { contains: options.search } } : {}),
    ...(options.city_id !== undefined ? { city_id: options.city_id } : {}),
    ...(options.doctor_speciality_id !== undefined
      ? { doctor_speciality_mappings: { some: { doctor_speciality_id: options.doctor_speciality_id } } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.doctors.findMany({
      where,
      select: doctorSelect,
      orderBy: [{ doctor_name: "asc" }, { id: "asc" }],
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.doctors.count({ where }),
  ]);

  return { items: rows.map(toSafeDoctor), total };
}

export async function getDoctorById(id: number) {
  const doctor = await prisma.doctors.findUnique({
    where: { id },
    select: doctorSelect,
  });

  if (!doctor) {
    throw new DoctorNotFoundError(id);
  }

  return toSafeDoctor(doctor);
}

/**
 * Public lookup by `seo_url` — returns the active doctor, or `null` if no
 * active doctor has this seo_url (never throws). This is the individual
 * doctor profile, distinct from a doctor_pages landing page — see
 * getDoctorPageBySeoUrl in doctor-page.service.ts.
 */
export async function getDoctorBySeoUrl(seoUrl: string) {
  const doctor = await prisma.doctors.findFirst({
    where: { seo_url: seoUrl, status: "active" },
    select: doctorSelect,
  });

  return doctor ? toSafeDoctor(doctor) : null;
}

export async function createDoctor(
  input: CreateDoctorInput,
  image?: DoctorImageInput
) {
  const data = { ...input, doc_info: sanitizeOptionalHtml(input.doc_info) };
  await ensureLanguageExists(data.language_id);
  await ensureCityExists(data.city_id);

  if (data.location_id != null) {
    await ensureLocationBelongsToCity(data.location_id, data.city_id);
  }

  const { schema_tags, ...rest } = data;

  const imagePath = image
    ? await storageProvider.upload(image, DOCTOR_UPLOAD_FOLDER)
    : null;

  const doctor = await prisma.doctors.create({
    data: {
      ...rest,
      ...(schema_tags !== undefined
        ? { schema_tags: toSchemaTagsInput(schema_tags) }
        : {}),
      doctor_image: imagePath,
    },
    select: doctorSelect,
  });

  return toSafeDoctor(doctor);
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
export async function updateDoctor(
  id: number,
  input: UpdateDoctorInput,
  image?: DoctorImageInput | null
) {
  const data = { ...input, ...(input.doc_info !== undefined ? { doc_info: sanitizeOptionalHtml(input.doc_info) } : {}) };
  const current = await prisma.doctors.findUnique({ where: { id } });

  if (!current) {
    throw new DoctorNotFoundError(id);
  }

  if (data.language_id !== undefined) {
    await ensureLanguageExists(data.language_id);
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

  let newImagePath: string | null | undefined;

  if (image === null) {
    newImagePath = null;
  } else if (image) {
    newImagePath = await storageProvider.upload(image, DOCTOR_UPLOAD_FOLDER);
  }

  const { schema_tags, ...rest } = data;

  try {
    const doctor = await prisma.doctors.update({
      where: { id },
      data: {
        ...rest,
        ...(schema_tags !== undefined
          ? { schema_tags: toSchemaTagsInput(schema_tags) }
          : {}),
        ...(newImagePath !== undefined ? { doctor_image: newImagePath } : {}),
        updated_at: new Date(),
      },
      select: doctorSelect,
    });

    if (newImagePath !== undefined && current.doctor_image) {
      await storageProvider
        .delete(current.doctor_image)
        .catch((error) =>
          console.error("Failed to delete old doctor image:", error)
        );
    }

    return toSafeDoctor(doctor);
  } catch (error) {
    if (newImagePath) {
      await storageProvider
        .delete(newImagePath)
        .catch((cleanupError) =>
          console.error(
            "Failed to clean up newly uploaded doctor image after a failed update:",
            cleanupError
          )
        );
    }

    throw error;
  }
}

/**
 * Soft delete: deactivates the doctor by setting status to "inactive".
 * The doctor_image and all mapping data (doctor_hospitals,
 * doctor_speciality_mappings) are preserved — neither the image nor the
 * mappings are automatically cleaned up by a soft delete.
 */
export async function deleteDoctor(id: number) {
  const current = await prisma.doctors.findUnique({ where: { id } });

  if (!current) {
    throw new DoctorNotFoundError(id);
  }

  await prisma.doctors.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
