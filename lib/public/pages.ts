import { getPages } from "@/services/page.service";
import { getGenericPageUrl } from "@/lib/public/urls";

/**
 * Public-safe generic CMS Page DTO — same reshaping pattern as
 * `lib/public/cities.ts`. A page's own URL is always flat (never
 * city-prefixed, see `getGenericPageUrl`), but whether it is *listed* in a
 * footer / nav list is scoped: see `getPublicPages`.
 */
export type PublicPage = {
  id: number;
  title: string;
  seoUrl: string;
  href: string;
  /** Where the admin placed this page's link in the footer (Pages -> Footer placement). */
  footerPlacement: "company" | "legal" | "hidden";
};

/**
 * Active generic CMS pages that are eligible to be LISTED for the given
 * city context, alphabetically ordered: global pages (`city_id` NULL)
 * always, and a city-specific page only on its own city — so a Mumbai page
 * can never leak into the Hyderabad footer or into the nationwide one.
 * `cityId: null` (global routes) lists global pages only. This filters
 * links, not routes: every page still resolves at its flat `/{seo_url}`.
 */
export async function getPublicPages(cityId: number | null): Promise<PublicPage[]> {
  const pages = await getPages();

  return pages
    .filter((page) => page.status === "active")
    .filter((page) => page.city_id === null || page.city_id === cityId)
    .map((page) => ({
      id: page.id,
      title: page.title,
      seoUrl: page.seo_url,
      href: getGenericPageUrl(page.seo_url),
      footerPlacement: page.footer_placement,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Explicit, admin-set (Pages -> Footer placement = "Legal links"); replaces the old guess based on keywords in the slug. */
export function isLegalPage(page: PublicPage): boolean {
  return page.footerPlacement === "legal";
}
