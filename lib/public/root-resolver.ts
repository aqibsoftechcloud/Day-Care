import { cache } from "react";
import { getCityBySeoUrl } from "@/services/city.service";
import { getPageBySeoUrl } from "@/services/page.service";

type City = NonNullable<Awaited<ReturnType<typeof getCityBySeoUrl>>>;
export type PublicPage = NonNullable<Awaited<ReturnType<typeof getPageBySeoUrl>>>;

export type RootSlugResolution =
  | { type: "city"; data: City }
  | { type: "page"; data: PublicPage };

/**
 * Resolves a root-level public slug against the two entity types that
 * share that namespace, in the locked precedence order: an active city
 * always wins over a same-named generic CMS Page. Intended for use inside
 * the future `app/(public)/[rootSlug]/page.tsx` Server Component — not
 * wired into any route yet.
 *
 * Returns `null` when neither an active city nor an active page matches,
 * which the caller should treat as `notFound()`.
 */
export async function resolveRootSlug(
  slug: string
): Promise<RootSlugResolution | null> {
  const city = await getCityBySeoUrl(slug);
  if (city) {
    return { type: "city", data: city };
  }

  const page = await getPageBySeoUrl(slug);
  if (page) {
    return { type: "page", data: page };
  }

  return null;
}

/**
 * `React.cache()`-wrapped so `app/(public)/[rootSlug]/layout.tsx` and
 * `app/(public)/[rootSlug]/page.tsx` — which both need this same
 * resolution (the layout to know the current city for the header, the
 * page to render the right shell) — share one lookup per request instead
 * of each querying independently.
 */
export const getCachedRootSlugResolution = cache((slug: string) =>
  resolveRootSlug(slug)
);
