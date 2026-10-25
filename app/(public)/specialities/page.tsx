import type { Metadata } from "next";
import { getCachedPublicSpecialityListing } from "@/lib/public/specialities";
import { getSpecialitiesUrl } from "@/lib/public/urls";
import { buildPublicMetadata } from "@/lib/public/seo";
import { PublicHeader } from "@/components/public/layout/PublicHeader";
import { PublicFooter } from "@/components/public/layout/PublicFooter";
import { SpecialityListingPage } from "@/components/public/specialities/SpecialityListingPage";

type SpecialitiesPageProps = {
  searchParams: Promise<{ page?: string }>;
};

/** Same `parsePage` convention as every other listing route in this project. */
function parsePage(raw: string | undefined): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * `/specialities` — the nationwide, city-independent Speciality listing.
 * Mirrors `app/(public)/treatments/page.tsx` exactly (see that file's own
 * doc comment). Reads `global_specialities` ONLY.
 */
export async function generateMetadata({ searchParams }: SpecialitiesPageProps): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  const metadata = buildPublicMetadata({
    title: page > 1 ? `Specialities — Page ${page}` : "Specialities",
    description: "Explore clinical specialities offered across Day Care Surgeries.",
    canonicalPath: page > 1 ? `${getSpecialitiesUrl()}?page=${page}` : getSpecialitiesUrl(),
  });

  return page > 1 ? { ...metadata, robots: { index: false, follow: true } } : metadata;
}

export default async function SpecialitiesListingRoute({ searchParams }: SpecialitiesPageProps) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const listing = await getCachedPublicSpecialityListing(page);

  return (
    <>
      <PublicHeader currentCityId={null} />
      <main>
        <SpecialityListingPage listing={listing} />
      </main>
      <PublicFooter currentCityId={null} />
    </>
  );
}
