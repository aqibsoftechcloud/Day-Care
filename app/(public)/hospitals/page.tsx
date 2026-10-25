import type { Metadata } from "next";
import { getCachedPublicHospitalListing } from "@/lib/public/hospitals";
import { getHospitalsNationwideUrl } from "@/lib/public/urls";
import { buildPublicMetadata } from "@/lib/public/seo";
import { PublicHeader } from "@/components/public/layout/PublicHeader";
import { PublicFooter } from "@/components/public/layout/PublicFooter";
import { HospitalListingPage } from "@/components/public/hospitals/HospitalListingPage";

type HospitalsPageProps = {
  searchParams: Promise<{ page?: string }>;
};

/** Same `parsePage` convention as every other listing route in this project. */
function parsePage(raw: string | undefined): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * `/hospitals` — the nationwide Hospital listing. NOT city-prefixed —
 * distinct from `/{city}/hospitals` (the existing per-city listing),
 * which this page does not replace or modify. No global_hospitals table:
 * this lists every active hospital nationwide, each card linking to its
 * real `/{city}/hospitals/{seoUrl}` detail page.
 */
export async function generateMetadata({ searchParams }: HospitalsPageProps): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  const metadata = buildPublicMetadata({
    title: page > 1 ? `Hospitals — Page ${page}` : "Our Hospitals",
    description: "Browse trusted partner hospitals across Day Care Surgeries.",
    canonicalPath: page > 1 ? `${getHospitalsNationwideUrl()}?page=${page}` : getHospitalsNationwideUrl(),
  });

  return page > 1 ? { ...metadata, robots: { index: false, follow: true } } : metadata;
}

export default async function HospitalsListingRoute({ searchParams }: HospitalsPageProps) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const listing = await getCachedPublicHospitalListing(page);

  return (
    <>
      <PublicHeader currentCityId={null} />
      <main>
        <HospitalListingPage listing={listing} />
      </main>
      <PublicFooter currentCityId={null} />
    </>
  );
}
