import { prisma } from "@/lib/prisma";
import { sanitizeOptionalHtml } from "@/lib/sanitize-html.server";
import { isReservedRootSlug } from "@/lib/public/reserved-slugs";
import type {
  CreatePageInput,
  ListPagesQuery,
  UpdatePageInput,
} from "@/validators/page.validator";

export class PageNotFoundError extends Error {
  constructor(id: number) {
    super(`Page with id ${id} not found`);
    this.name = "PageNotFoundError";
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

/** A page whose scope would end up as "city" has no city to attach to. */
export class PageCityRequiredError extends Error {
  constructor() {
    super("City is required for a city-specific page");
    this.name = "PageCityRequiredError";
  }
}

/** The seo_url is a reserved root path (/blogs, /api, /contact-us, ...) and would shadow a real route. */
export class ReservedPageSeoUrlError extends Error {
  constructor(seoUrl: string) {
    super(`"${seoUrl}" is a reserved URL and cannot be used for a page`);
    this.name = "ReservedPageSeoUrlError";
  }
}

/** A city already uses this root slug; the public resolver gives cities precedence, so the page would be unreachable. */
export class PageSeoUrlCityConflictError extends Error {
  constructor(seoUrl: string) {
    super(`"${seoUrl}" is already used by a city, so a page cannot use it`);
    this.name = "PageSeoUrlCityConflictError";
  }
}

const pageSelect = {
  id: true,
  language_id: true,
  title: true,
  seo_url: true,
  meta_title: true,
  meta_description: true,
  meta_keyword: true,
  category: true,
  city_id: true,
  location_id: true,
  body: true,
  status: true,
  footer_placement: true,
  created_at: true,
  updated_at: true,
  languages: { select: { id: true, name: true } },
  cities: { select: { id: true, city_name: true } },
  locations: { select: { id: true, area: true, zipcode: true } },
} as const;

type PageRecord = {
  id: number;
  language_id: number;
  title: string;
  seo_url: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keyword: string | null;
  category: string;
  city_id: number | null;
  location_id: number | null;
  body: string | null;
  status: string;
  footer_placement: "company" | "legal" | "hidden";
  created_at: Date;
  updated_at: Date;
  languages: { id: number; name: string };
  cities: { id: number; city_name: string } | null;
  locations: { id: number; area: string; zipcode: string } | null;
};

function toSafePage(page: PageRecord) {
  const { languages, cities, locations, ...rest } = page;

  // `scope` is derived from the stored city_id (NULL = global) - never stored separately, so it cannot drift.
  return { ...rest, scope: rest.city_id === null ? ("global" as const) : ("city" as const), language: languages, city: cities, location: locations };
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

async function ensureSeoUrlUsable(seoUrl: string) {
  if (isReservedRootSlug(seoUrl)) {
    throw new ReservedPageSeoUrlError(seoUrl);
  }

  const city = await prisma.cities.findFirst({ where: { seo_url: seoUrl }, select: { id: true } });

  if (city) {
    throw new PageSeoUrlCityConflictError(seoUrl);
  }
}

export async function getPages(filter?: ListPagesQuery) {
  const pages = await prisma.pages.findMany({
    where: {
      ...(filter?.city_id !== undefined ? { city_id: filter.city_id } : {}),
      ...(filter?.scope === "global" ? { city_id: null } : {}),
      ...(filter?.scope === "city" ? { city_id: { not: null } } : {}),
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: pageSelect,
    orderBy: { id: "asc" },
  });

  return pages.map(toSafePage);
}

export async function getPageById(id: number) {
  const page = await prisma.pages.findUnique({
    where: { id },
    select: pageSelect,
  });

  if (!page) {
    throw new PageNotFoundError(id);
  }

  return toSafePage(page);
}

/**
 * Public lookup by `seo_url` — returns the active page, or `null` if no
 * active page has this seo_url (never throws). Used by the future public
 * root resolver, checked only after an active city lookup misses.
 */
export async function getPageBySeoUrl(seoUrl: string) {
  const page = await prisma.pages.findFirst({
    where: { seo_url: seoUrl, status: "active" },
    select: pageSelect,
  });

  return page ? toSafePage(page) : null;
}

export async function createPage(input: CreatePageInput) {
  const data = { ...input, body: sanitizeOptionalHtml(input.body) };
  const { scope, ...fields } = data;
  // Global pages are stored with city_id NULL; a city page's city was already required by the validator.
  const cityId = scope === "global" ? null : fields.city_id ?? null;

  await ensureLanguageExists(fields.language_id);
  await ensureSeoUrlUsable(fields.seo_url);

  if (cityId !== null) {
    await ensureCityExists(cityId);

    if (fields.location_id != null) {
      await ensureLocationBelongsToCity(fields.location_id, cityId);
    }
  }

  const page = await prisma.pages.create({
    data: { ...fields, city_id: cityId, location_id: cityId === null ? null : fields.location_id ?? null },
    select: pageSelect,
  });

  return toSafePage(page);
}

export async function updatePage(id: number, input: UpdatePageInput) {
  const data = { ...input, ...(input.body !== undefined ? { body: sanitizeOptionalHtml(input.body) } : {}) };
  const current = await prisma.pages.findUnique({ where: { id } });

  if (!current) {
    throw new PageNotFoundError(id);
  }

  if (data.language_id !== undefined) {
    await ensureLanguageExists(data.language_id);
  }

  const { scope, ...fields } = data;

  if (fields.seo_url !== undefined && fields.seo_url !== current.seo_url) {
    await ensureSeoUrlUsable(fields.seo_url);
  }

  // Scope only ever changes when the caller says so explicitly (an existing
  // city page is never silently turned global). Omitted scope: a supplied
  // city_id implies "city", otherwise the stored scope is kept.
  const targetScope = scope ?? (fields.city_id != null ? "city" : current.city_id === null ? "global" : "city");
  const effectiveCityId = targetScope === "global" ? null : fields.city_id ?? current.city_id;

  if (targetScope === "city" && effectiveCityId === null) {
    throw new PageCityRequiredError();
  }

  if (effectiveCityId !== null && effectiveCityId !== current.city_id) {
    await ensureCityExists(effectiveCityId);
  }

  let nextLocationId: number | null | undefined = fields.location_id;

  if (effectiveCityId === null) {
    nextLocationId = null;
  } else if (nextLocationId !== undefined) {
    // location_id explicitly supplied (a number, or null to clear it)
    if (nextLocationId !== null) {
      await ensureLocationBelongsToCity(nextLocationId, effectiveCityId);
    }
  } else if (effectiveCityId !== current.city_id && current.location_id !== null) {
    // city changed, location left unchanged -> re-validate it against the new city
    await ensureLocationBelongsToCity(current.location_id, effectiveCityId);
  }

  const page = await prisma.pages.update({
    where: { id },
    data: {
      ...fields,
      city_id: effectiveCityId,
      ...(nextLocationId !== undefined ? { location_id: nextLocationId } : {}),
      updated_at: new Date(),
    },
    select: pageSelect,
  });

  return toSafePage(page);
}

/**
 * Soft delete: deactivates the page by setting status to "inactive".
 */
export async function deletePage(id: number) {
  const current = await prisma.pages.findUnique({ where: { id } });

  if (!current) {
    throw new PageNotFoundError(id);
  }

  await prisma.pages.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
