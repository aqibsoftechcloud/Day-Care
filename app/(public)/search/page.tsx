import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/layout/PublicHeader";
import { PublicFooter } from "@/components/public/layout/PublicFooter";
import { SearchResultsPage } from "@/components/public/search/SearchResultsPage";
import { getCachedSearchResults, normalizeSearchQuery } from "@/lib/public/search";
import { buildPublicMetadata } from "@/lib/public/seo";

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[]; city?: string | string[] }>;
};

const RESULT_LIMIT = 20;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * `/search?q=…&city=…` — NOT city-prefixed, and "search" is a reserved
 * top-level segment (lib/public/reserved-slugs.ts). `city` is an optional
 * city `seo_url`; the header and footer receive the resolved city so the
 * page keeps the visitor's city context. Search pages are never indexed.
 */
export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const query = normalizeSearchQuery(first((await searchParams).q));

  return {
    ...buildPublicMetadata({
      title: query ? `Search results for “${query}”` : "Search",
      description: "Search doctors, treatments, specialities and hospitals at Day Care Surgeries.",
      canonicalPath: "/search",
    }),
    robots: { index: false, follow: true },
  };
}

export default async function SearchRoute({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const rawQuery = first(params.q);
  const citySlug = first(params.city) || null;
  const results = await getCachedSearchResults(normalizeSearchQuery(rawQuery), citySlug, RESULT_LIMIT);

  return (
    <>
      <PublicHeader currentCityId={results.city?.id ?? null} />
      <main>
        <SearchResultsPage results={results} rawQuery={rawQuery} />
      </main>
      <PublicFooter currentCityId={results.city?.id ?? null} />
    </>
  );
}
