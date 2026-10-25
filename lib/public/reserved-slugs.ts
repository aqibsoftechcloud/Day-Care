/**
 * Root-level path segments that are permanently reserved by the public
 * site's static routes, or by the CMS/API namespaces, and must never be
 * assignable as a generic CMS Page's `seo_url` or a `cities.seo_url`
 * value — either one would otherwise make that static route (or the
 * other namespace) unreachable through the future merged
 * `app/(public)/[rootSlug]/page.tsx` resolver.
 *
 * This is the single source of truth for that list. A future phase wires
 * `isReservedRootSlug` into the Pages/Cities validators; this file does
 * not enforce anything on its own yet.
 */
const RESERVED_ROOT_SLUGS = new Set<string>([
  // Locked public route segments (see the approved URL architecture).
  "cities",
  // The city-independent "global" content namespace — /dcg/{seoUrl} —
  // see lib/public/urls.ts's getGlobalContentUrl(). Must never be
  // assignable as a City or generic Page seo_url, the same reasoning as
  // every other entry in this list.
  "dcg",
  // The OLD global-content prefix — now a permanent redirect to /dcg/
  // (see next.config.ts's redirects()). Stays reserved so it can never
  // be reassigned and shadow that redirect.
  "c",
  "specialities",
  "treatments",
  "hospitals",
  "doctors",
  "find-a-doctor",
  "blogs",
  "search",
  "book-appointment", // permanently redirects to /contact-us (see next.config.ts)
  "contact-us",
  "conditions",
  "health-packages",
  "testimonials",
  "gallery",
  "news-media",
  "events",
  "faqs",
  "tools",

  // Permanently reserved non-public namespaces.
  "api",
  "dcs-panel",

  // Framework/infra paths that would otherwise collide with a
  // dynamically-resolved root slug.
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

/** True if `slug` is reserved and must never be used as a city or generic-page `seo_url`. Exact, case-sensitive match — the same comparison convention used for every other `seo_url` lookup in this codebase. */
export function isReservedRootSlug(slug: string): boolean {
  return RESERVED_ROOT_SLUGS.has(slug);
}

export { RESERVED_ROOT_SLUGS };
