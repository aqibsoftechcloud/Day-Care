import type { Metadata } from "next";
import { getCachedPublicDoctorListing, getPublicDoctorListingFilterOptions } from "@/lib/public/doctors";
import { getDoctorsUrl } from "@/lib/public/urls";
import { buildPublicMetadata } from "@/lib/public/seo";
import { PublicHeader } from "@/components/public/layout/PublicHeader";
import { PublicFooter } from "@/components/public/layout/PublicFooter";
import { DoctorListingPage } from "@/components/public/doctors/DoctorListingPage";

type DoctorsPageProps = {
  searchParams: Promise<{ page?: string; search?: string; city?: string; speciality?: string }>;
};

/** Parses `?page=`, defaulting to and clamping at 1 — never NaN, never 0/negative. Same convention as `app/(public)/blogs/page.tsx`'s own `parsePage`. */
function parsePage(raw: string | undefined): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

/** Parses a positive-integer id query param, or `null` if absent/invalid — never NaN silently reaching a Prisma filter. */
function parseId(raw: string | undefined): number | null {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * `/doctors` — the nationwide Doctor listing. NOT city-prefixed, same
 * "reserved top-level segment" convention as `/blogs` and `/dcg`. Doctors
 * remain city-scoped physical entities — this page lists every active
 * one nationwide (no global_doctors table) by default, and each card
 * still links to that doctor's real `/{city}/doctors/{seoUrl}` profile.
 * `?search=`/`?city=`/`?speciality=` only ever NARROW this same
 * nationwide set when the admin explicitly chooses them on the page's
 * own filter bar — never derived from the header's selected city or any
 * other ambient context (see PublicHeader's `currentCityId={null}` below,
 * same "no city context" convention `/`/`/blogs` already use).
 */
export async function generateMetadata({ searchParams }: DoctorsPageProps): Promise<Metadata> {
  const { page: pageParam, search, city, speciality } = await searchParams;
  const page = parsePage(pageParam);
  const hasFilter = Boolean(search?.trim()) || parseId(city) !== null || parseId(speciality) !== null;

  const metadata = buildPublicMetadata({
    title: page > 1 ? `Find the Right Doctor for Your Care — Page ${page}` : "Find the Right Doctor for Your Care",
    description: "Browse experienced doctors and specialists across every Day Care Surgeries location.",
    // Filtered/searched/paginated views are variations of the same listing,
    // not distinct content — canonical always points at the plain base
    // listing, same "never contradict what's actually unique content"
    // policy the rest of this site's pagination already follows.
    canonicalPath: getDoctorsUrl(),
  });

  // Page 1 with no filter stays indexable. Any filtered view or page 2+
  // self-canonicalizes to the base listing above but is marked noindex,
  // follow — avoids indexing near-duplicate/thin filtered permutations
  // without blocking crawlers from reaching doctor profiles linked from
  // the page.
  return page > 1 || hasFilter ? { ...metadata, robots: { index: false, follow: true } } : metadata;
}

export default async function DoctorsListingRoute({ searchParams }: DoctorsPageProps) {
  const { page: pageParam, search, city, speciality } = await searchParams;
  const page = parsePage(pageParam);
  const searchTerm = search?.trim() ?? "";
  const cityId = parseId(city);
  const doctorSpecialityId = parseId(speciality);

  const [listing, filterOptions] = await Promise.all([
    getCachedPublicDoctorListing(page, searchTerm, cityId ?? undefined, doctorSpecialityId ?? undefined),
    getPublicDoctorListingFilterOptions(),
  ]);

  return (
    <>
      <PublicHeader currentCityId={null} />
      <main>
        <DoctorListingPage
          listing={listing}
          filterOptions={filterOptions}
          search={searchTerm}
          cityId={cityId}
          doctorSpecialityId={doctorSpecialityId}
        />
      </main>
      <PublicFooter currentCityId={null} />
    </>
  );
}
