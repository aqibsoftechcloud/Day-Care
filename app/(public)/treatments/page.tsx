import type { Metadata } from "next";
import { getCachedPublicTreatmentListing } from "@/lib/public/treatments";
import { getTreatmentsUrl } from "@/lib/public/urls";
import { buildPublicMetadata } from "@/lib/public/seo";
import { PublicHeader } from "@/components/public/layout/PublicHeader";
import { PublicFooter } from "@/components/public/layout/PublicFooter";
import { TreatmentListingPage } from "@/components/public/treatments/TreatmentListingPage";

type TreatmentsPageProps = {
  searchParams: Promise<{ page?: string }>;
};

/** Same `parsePage` convention as every other listing route in this project. */
function parsePage(raw: string | undefined): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * `/treatments` — the nationwide, city-independent Treatment listing.
 * Reads `global_treatments` ONLY (via `lib/public/treatments.ts`) — never
 * the city-scoped `treatments` table, never a "pick one city" fallback.
 * Distinct from both `/{city}/treatments` (city listing, not built by
 * this task) and `/{city}/treatments/{seoUrl}` (city detail, untouched).
 * Each card links to `/dcg/{seoUrl}` — the existing, locked Global
 * Treatment detail page.
 */
export async function generateMetadata({ searchParams }: TreatmentsPageProps): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  const metadata = buildPublicMetadata({
    title: page > 1 ? `Treatments — Page ${page}` : "Treatments",
    description: "Explore treatments offered across Day Care Surgeries.",
    canonicalPath: page > 1 ? `${getTreatmentsUrl()}?page=${page}` : getTreatmentsUrl(),
  });

  return page > 1 ? { ...metadata, robots: { index: false, follow: true } } : metadata;
}

export default async function TreatmentsListingRoute({ searchParams }: TreatmentsPageProps) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const listing = await getCachedPublicTreatmentListing(page);

  return (
    <>
      <PublicHeader currentCityId={null} />
      <main>
        <TreatmentListingPage listing={listing} />
      </main>
      <PublicFooter currentCityId={null} />
    </>
  );
}
