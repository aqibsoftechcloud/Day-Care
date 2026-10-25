import { prisma } from "@/lib/prisma";
import { sanitizeHtmlFields } from "@/lib/sanitize-html.server";
import { storageProvider } from "@/lib/storage";
import type {
  CreateTestimonialInput,
  ListTestimonialsQuery,
  UpdateTestimonialInput,
} from "@/validators/testimonial.validator";

export class TestimonialNotFoundError extends Error {
  constructor(id: number) {
    super(`Testimonial with id ${id} not found`);
    this.name = "TestimonialNotFoundError";
  }
}

export class CityNotFoundError extends Error {
  constructor(cityId: number) {
    super(`City with id ${cityId} not found`);
    this.name = "CityNotFoundError";
  }
}

export class LanguageNotFoundError extends Error {
  constructor(languageId: number) {
    super(`Language with id ${languageId} not found`);
    this.name = "LanguageNotFoundError";
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

export class DoctorNotFoundError extends Error {
  constructor(doctorId: number) {
    super(`Doctor with id ${doctorId} not found`);
    this.name = "DoctorNotFoundError";
  }
}

export class SpecialityNotFoundError extends Error {
  constructor(specialityId: number) {
    super(`Speciality with id ${specialityId} not found`);
    this.name = "SpecialityNotFoundError";
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

export type TestimonialImageInput = { buffer: Buffer; mimeType: string };

const TESTIMONIAL_UPLOAD_FOLDER = "testimonials";

const testimonialSelect = {
  id: true,
  language_id: true,
  testimonial_name: true,
  meta_title: true,
  meta_description: true,
  meta_keywords: true,
  seo_url: true,
  youtube_url: true,
  city_id: true,
  location_id: true,
  hospital_id: true,
  doctor_id: true,
  speciality_id: true,
  publish_date: true,
  testimonial_image: true,
  description: true,
  status: true,
  created_at: true,
  updated_at: true,
  cities: { select: { id: true, city_name: true, seo_url: true } },
  languages: { select: { id: true, name: true, seo_url: true } },
  locations: {
    select: { id: true, area: true, zipcode: true, seo_url: true },
  },
  hospitals: { select: { id: true, hospital_name: true, seo_url: true } },
  doctors: { select: { id: true, doctor_name: true, seo_url: true } },
  // The real clinical speciality — replaces the removed
  // patient_specialities/patient_treatments taxonomy entirely.
  specialities: {
    select: { id: true, speciality_name: true, seo_url: true },
  },
} as const;

type TestimonialRecord = {
  id: number;
  language_id: number;
  testimonial_name: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  seo_url: string;
  youtube_url: string | null;
  city_id: number;
  location_id: number | null;
  hospital_id: number | null;
  doctor_id: number | null;
  speciality_id: number | null;
  publish_date: Date | null;
  testimonial_image: string | null;
  description: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
  cities: { id: number; city_name: string; seo_url: string };
  languages: { id: number; name: string; seo_url: string };
  locations: {
    id: number;
    area: string;
    zipcode: string;
    seo_url: string;
  } | null;
  hospitals: { id: number; hospital_name: string; seo_url: string } | null;
  doctors: { id: number; doctor_name: string; seo_url: string } | null;
  specialities: {
    id: number;
    speciality_name: string;
    seo_url: string;
  } | null;
};

function toSafeTestimonial(testimonial: TestimonialRecord) {
  const {
    cities,
    languages,
    locations,
    hospitals,
    doctors,
    specialities,
    ...rest
  } = testimonial;

  return {
    ...rest,
    city: cities,
    language: languages,
    location: locations,
    hospital: hospitals,
    doctor: doctors,
    speciality: specialities,
  };
}

async function ensureCityExists(cityId: number) {
  const city = await prisma.cities.findUnique({ where: { id: cityId } });

  if (!city) {
    throw new CityNotFoundError(cityId);
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

async function ensureHospitalExists(hospitalId: number) {
  const hospital = await prisma.hospitals.findUnique({
    where: { id: hospitalId },
  });

  if (!hospital) {
    throw new HospitalNotFoundError(hospitalId);
  }
}

async function ensureDoctorExists(doctorId: number) {
  const doctor = await prisma.doctors.findUnique({ where: { id: doctorId } });

  if (!doctor) {
    throw new DoctorNotFoundError(doctorId);
  }
}

/**
 * Validates against the real clinical `specialities` table — never
 * `doctor_specialities` (the nationwide doctor taxonomy).
 */
async function ensureSpecialityExists(specialityId: number) {
  const speciality = await prisma.specialities.findUnique({
    where: { id: specialityId },
  });

  if (!speciality) {
    throw new SpecialityNotFoundError(specialityId);
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

export async function getTestimonials(filter?: ListTestimonialsQuery) {
  const testimonials = await prisma.testimonials.findMany({
    where: {
      ...(filter?.city_id !== undefined ? { city_id: filter.city_id } : {}),
      ...(filter?.doctor_id !== undefined
        ? { doctor_id: filter.doctor_id }
        : {}),
      ...(filter?.hospital_id !== undefined
        ? { hospital_id: filter.hospital_id }
        : {}),
      ...(filter?.language_id !== undefined
        ? { language_id: filter.language_id }
        : {}),
      ...(filter?.location_id !== undefined
        ? { location_id: filter.location_id }
        : {}),
      ...(filter?.speciality_id !== undefined
        ? { speciality_id: filter.speciality_id }
        : {}),
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: testimonialSelect,
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
  });

  return testimonials.map(toSafeTestimonial);
}

export async function getTestimonialById(id: number) {
  const testimonial = await prisma.testimonials.findUnique({
    where: { id },
    select: testimonialSelect,
  });

  if (!testimonial) {
    throw new TestimonialNotFoundError(id);
  }

  return toSafeTestimonial(testimonial);
}

export async function createTestimonial(
  input: CreateTestimonialInput,
  image?: TestimonialImageInput
) {
  const data = sanitizeHtmlFields(input, ["description"]);
  await ensureCityExists(data.city_id);
  await ensureLanguageExists(data.language_id);

  if (data.hospital_id != null) {
    await ensureHospitalExists(data.hospital_id);
  }

  if (data.doctor_id != null) {
    await ensureDoctorExists(data.doctor_id);
  }

  if (data.speciality_id != null) {
    await ensureSpecialityExists(data.speciality_id);
  }

  if (data.location_id != null) {
    await ensureLocationBelongsToCity(data.location_id, data.city_id);
  }

  const imagePath = image
    ? await storageProvider.upload(image, TESTIMONIAL_UPLOAD_FOLDER)
    : null;

  const testimonial = await prisma.testimonials.create({
    data: { ...data, testimonial_image: imagePath },
    select: testimonialSelect,
  });

  return toSafeTestimonial(testimonial);
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
export async function updateTestimonial(
  id: number,
  input: UpdateTestimonialInput,
  image?: TestimonialImageInput | null
) {
  const data = sanitizeHtmlFields(input, ["description"]);
  const current = await prisma.testimonials.findUnique({ where: { id } });

  if (!current) {
    throw new TestimonialNotFoundError(id);
  }

  if (data.city_id !== undefined) {
    await ensureCityExists(data.city_id);
  }

  if (data.language_id !== undefined) {
    await ensureLanguageExists(data.language_id);
  }

  if (data.hospital_id !== undefined && data.hospital_id !== null) {
    await ensureHospitalExists(data.hospital_id);
  }

  if (data.doctor_id !== undefined && data.doctor_id !== null) {
    await ensureDoctorExists(data.doctor_id);
  }

  if (data.speciality_id !== undefined && data.speciality_id !== null) {
    await ensureSpecialityExists(data.speciality_id);
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
    newImagePath = await storageProvider.upload(
      image,
      TESTIMONIAL_UPLOAD_FOLDER
    );
  }

  try {
    const testimonial = await prisma.testimonials.update({
      where: { id },
      data: {
        ...data,
        ...(newImagePath !== undefined
          ? { testimonial_image: newImagePath }
          : {}),
        updated_at: new Date(),
      },
      select: testimonialSelect,
    });

    if (newImagePath !== undefined && current.testimonial_image) {
      await storageProvider
        .delete(current.testimonial_image)
        .catch((error) =>
          console.error("Failed to delete old testimonial image:", error)
        );
    }

    return toSafeTestimonial(testimonial);
  } catch (error) {
    if (newImagePath) {
      await storageProvider
        .delete(newImagePath)
        .catch((cleanupError) =>
          console.error(
            "Failed to clean up newly uploaded testimonial image after a failed update:",
            cleanupError
          )
        );
    }

    throw error;
  }
}

/**
 * Soft delete: deactivates the testimonial by setting status to
 * "inactive". All content and the associated image are preserved.
 */
export async function deleteTestimonial(id: number) {
  const current = await prisma.testimonials.findUnique({ where: { id } });

  if (!current) {
    throw new TestimonialNotFoundError(id);
  }

  await prisma.testimonials.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
