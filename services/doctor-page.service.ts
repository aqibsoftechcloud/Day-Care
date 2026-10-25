import { prisma } from "@/lib/prisma";
import { sanitizeHtmlFields } from "@/lib/sanitize-html.server";
import type {
  CreateDoctorPageInput,
  UpdateDoctorPageInput,
} from "@/validators/doctor-page.validator";

export class DoctorPageNotFoundError extends Error {
  constructor(id: number) {
    super(`Doctor page with id ${id} not found`);
    this.name = "DoctorPageNotFoundError";
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

const doctorPageSelect = {
  id: true,
  pagename: true,
  keyword: true,
  meta_title: true,
  meta_description: true,
  meta_keywords: true,
  seo_url: true,
  city_id: true,
  location_id: true,
  speciality_id: true,
  description: true,
  status: true,
  created_at: true,
  updated_at: true,
  // `seo_url` is included on `cities` so the future public city-prefixed
  // route can validate the URL's city segment against this row's actual
  // city — see lib/public/root-resolver.ts and the locked URL
  // architecture's city-validation/redirect rule.
  cities: { select: { id: true, city_name: true, seo_url: true } },
  locations: { select: { id: true, area: true, zipcode: true } },
  specialities: {
    select: {
      id: true,
      speciality_name: true,
      speciality_title: true,
      seo_url: true,
    },
  },
} as const;

type DoctorPageRecord = {
  id: number;
  pagename: string;
  keyword: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  seo_url: string;
  city_id: number;
  location_id: number | null;
  speciality_id: number;
  description: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
  cities: { id: number; city_name: string; seo_url: string };
  locations: { id: number; area: string; zipcode: string } | null;
  specialities: {
    id: number;
    speciality_name: string;
    speciality_title: string | null;
    seo_url: string;
  };
};

function toSafeDoctorPage(page: DoctorPageRecord) {
  const { cities, locations, specialities, ...rest } = page;

  return {
    ...rest,
    city: cities,
    location: locations,
    speciality: specialities,
  };
}

async function ensureCityExists(cityId: number) {
  const city = await prisma.cities.findUnique({ where: { id: cityId } });

  if (!city) {
    throw new CityNotFoundError(cityId);
  }
}

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

export async function getDoctorPages() {
  const pages = await prisma.doctor_pages.findMany({
    select: doctorPageSelect,
    orderBy: { id: "asc" },
  });

  return pages.map(toSafeDoctorPage);
}

export async function getDoctorPageById(id: number) {
  const page = await prisma.doctor_pages.findUnique({
    where: { id },
    select: doctorPageSelect,
  });

  if (!page) {
    throw new DoctorPageNotFoundError(id);
  }

  return toSafeDoctorPage(page);
}

/**
 * Public lookup by `seo_url` — returns the active doctor page, or `null`
 * if no active doctor page has this seo_url (never throws). This is the
 * city x speciality x optional-location landing page, distinct from an
 * individual doctor profile — see getDoctorBySeoUrl in doctor.service.ts.
 */
export async function getDoctorPageBySeoUrl(seoUrl: string) {
  const page = await prisma.doctor_pages.findFirst({
    where: { seo_url: seoUrl, status: "active" },
    select: doctorPageSelect,
  });

  return page ? toSafeDoctorPage(page) : null;
}

export async function createDoctorPage(input: CreateDoctorPageInput) {
  const data = sanitizeHtmlFields(input, ["description"]);
  await ensureCityExists(data.city_id);
  await ensureSpecialityExists(data.speciality_id);

  if (data.location_id != null) {
    await ensureLocationBelongsToCity(data.location_id, data.city_id);
  }

  const page = await prisma.doctor_pages.create({
    data,
    select: doctorPageSelect,
  });

  return toSafeDoctorPage(page);
}

export async function updateDoctorPage(
  id: number,
  input: UpdateDoctorPageInput
) {
  const data = sanitizeHtmlFields(input, ["description"]);
  const current = await prisma.doctor_pages.findUnique({ where: { id } });

  if (!current) {
    throw new DoctorPageNotFoundError(id);
  }

  if (data.city_id !== undefined) {
    await ensureCityExists(data.city_id);
  }

  if (data.speciality_id !== undefined) {
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

  const page = await prisma.doctor_pages.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
    select: doctorPageSelect,
  });

  return toSafeDoctorPage(page);
}

/**
 * Soft delete: deactivates the doctor page by setting status to "inactive".
 */
export async function deleteDoctorPage(id: number) {
  const current = await prisma.doctor_pages.findUnique({ where: { id } });

  if (!current) {
    throw new DoctorPageNotFoundError(id);
  }

  await prisma.doctor_pages.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
