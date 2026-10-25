import { getBanners } from "@/services/banner.service";

/**
 * Public-safe Hero/Banner DTO — only the real `banners` columns the Hero
 * section renders. No `heading`/`description`/`cta_text` exist on the
 * model, so none are fabricated here: `name` IS `banner_name`, and there
 * is nothing else to show but the two images and the optional link.
 */
export type PublicHeroBanner = {
  id: number;
  name: string;
  imageUrl: string;
  mobileImageUrl: string | null;
  ctaUrl: string | null;
};

/**
 * The single highest-priority active banner for the given city context:
 * `status = active`, `city_id` match (or any city when `cityId` is
 * `null`, e.g. the nationwide `/` homepage — same "no city context
 * filters nothing" convention as the rest of `lib/public/`), ordered by
 * `sorting_order` ascending and `id` descending as the tie-breaker (the
 * most recently created banner wins a tie). `getBanners()` applies no
 * filter/order guarantee useful here itself, so both are applied in this
 * public layer instead of changing the shared admin service.
 *
 * Returns `null` when no active banner matches — the caller renders a
 * clean, image-less fallback rather than a broken image or invented
 * placeholder content.
 */
export async function getHeroBanner(cityId: number | null): Promise<PublicHeroBanner | null> {
  const banners = await getBanners();

  const active = banners
    .filter((banner) => banner.status === "active" && (cityId === null || banner.city_id === cityId))
    .sort((a, b) => a.sorting_order - b.sorting_order || b.id - a.id);

  const banner = active[0];
  if (!banner) return null;

  return {
    id: banner.id,
    name: banner.banner_name,
    imageUrl: banner.banner_image,
    mobileImageUrl: banner.mobile_banner_image,
    ctaUrl: banner.banner_url,
  };
}
