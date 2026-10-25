import { getCities } from "@/services/city.service";
import { getCityUrl } from "@/lib/public/urls";

/**
 * Public-safe city DTO — only what the public site's city selector needs.
 * Reshapes `services/city.service.ts`'s raw Prisma row, same pattern as
 * every other file in `lib/public/`.
 */
export type PublicCity = {
  id: number;
  name: string;
  seoUrl: string;
  href: string;
};

/**
 * Active cities for the public city selector, alphabetically ordered by
 * name (the DB's `id asc` order from `getCities()` has no meaning to a
 * site visitor). Inactive cities are never shown on the public site —
 * `getCities()` applies no status filter itself, so it's applied here,
 * same established pattern as `getHomepageBanner`/`getHomepageHospitals`.
 */
export async function getPublicCities(): Promise<PublicCity[]> {
  const cities = await getCities();

  return cities
    .filter((city) => city.status === "active")
    .map((city) => ({
      id: city.id,
      name: city.city_name,
      seoUrl: city.seo_url,
      href: getCityUrl(city.seo_url),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
