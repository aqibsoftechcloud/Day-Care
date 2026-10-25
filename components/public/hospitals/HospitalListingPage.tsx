import { HospitalCard } from "@/components/public/home/HospitalCard";
import { ListingPagination } from "@/components/public/shared/ListingPagination";
import { getHospitalsNationwideUrl } from "@/lib/public/urls";
import type { PublicHospitalListing } from "@/lib/public/hospitals";
import { PublicBreadcrumb } from "@/components/public/shared/PublicBreadcrumb";

type HospitalListingPageProps = {
  listing: PublicHospitalListing;
};

function pageHref(page: number): string {
  return page <= 1 ? getHospitalsNationwideUrl() : `${getHospitalsNationwideUrl()}?page=${page}`;
}

/**
 * Nationwide `/hospitals` listing — every active hospital, no city
 * filter. Mirrors `DoctorListingPage` exactly; reuses the existing
 * `HospitalCard`.
 */
export function HospitalListingPage({ listing }: HospitalListingPageProps) {
  const { items, page, totalPages } = listing;

  return (
    <div className="public-container py-10 sm:py-12">
      <PublicBreadcrumb className="mb-4" items={[{ label: "Home", href: "/" }, { label: "Hospitals" }]} />
      <h1 className="text-2xl font-black tracking-tight text-(--public-primary) sm:text-3xl">Our Hospitals</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
        Browse trusted partner hospitals across Day Care Surgeries.
      </p>

      {items.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 sm:mt-10">
          {items.map((hospital) => (
            <HospitalCard key={hospital.id} hospital={hospital} />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-slate-500">No hospitals available yet.</p>
      )}

      {totalPages > 1 && (
        <div className="mt-10 sm:mt-12">
          <ListingPagination page={page} totalPages={totalPages} buildHref={pageHref} />
        </div>
      )}
    </div>
  );
}
