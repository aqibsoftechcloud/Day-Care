import { prisma } from "@/lib/prisma";
import type {
  CreateCityInput,
  UpdateCityInput,
} from "@/validators/city.validator";

export class CityNotFoundError extends Error {
  constructor(id: number) {
    super(`City with id ${id} not found`);
    this.name = "CityNotFoundError";
  }
}

export class LanguageNotFoundError extends Error {
  constructor(languageId: number) {
    super(`Language with id ${languageId} not found`);
    this.name = "LanguageNotFoundError";
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

export function getCities() {
  return prisma.cities.findMany({
    orderBy: { id: "asc" },
  });
}

export async function getCityById(id: number) {
  const city = await prisma.cities.findUnique({ where: { id } });

  if (!city) {
    throw new CityNotFoundError(id);
  }

  return city;
}

/**
 * Public lookup by `seo_url` — returns the active city, or `null` if no
 * active city has this seo_url (never throws). Used by the future public
 * root resolver, where a city takes precedence over a generic CMS Page
 * sharing the same seo_url.
 */
export function getCityBySeoUrl(seoUrl: string) {
  return prisma.cities.findFirst({
    where: { seo_url: seoUrl, status: "active" },
  });
}

export async function createCity(data: CreateCityInput) {
  await ensureLanguageExists(data.language_id);

  return prisma.cities.create({ data });
}

export async function updateCity(id: number, data: UpdateCityInput) {
  await getCityById(id);

  if (data.language_id !== undefined) {
    await ensureLanguageExists(data.language_id);
  }

  return prisma.cities.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
  });
}

/**
 * Soft delete: deactivates the city by setting status to "inactive".
 * Cities are referenced by banners/blogs/doctor_pages/doctors/hospitals/
 * locations/menus/pages/specialities/testimonials/treatments, so they are
 * never physically removed — matching the convention already used for
 * modules, users, and languages.
 */
export async function deleteCity(id: number) {
  await getCityById(id);

  await prisma.cities.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
