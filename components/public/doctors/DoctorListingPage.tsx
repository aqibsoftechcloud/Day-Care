import { DoctorCard } from "@/components/public/home/DoctorCard";
import { DoctorListingFilters } from "@/components/public/doctors/DoctorListingFilters";
import { ListingPagination } from "@/components/public/shared/ListingPagination";
import { getDoctorsUrl } from "@/lib/public/urls";
import type { PublicDoctorListing, PublicDoctorListingFilterOptions } from "@/lib/public/doctors";
import { PublicBreadcrumb } from "@/components/public/shared/PublicBreadcrumb";

type DoctorListingPageProps = {
  listing: PublicDoctorListing;
  filterOptions: PublicDoctorListingFilterOptions;
  search: string;
  cityId: number | null;
  doctorSpecialityId: number | null;
};

/** Preserves the current filter selection across page links — a page link is still a "narrower view of the same filtered set," not a filter reset. */
function pageHref(search: string, cityId: number | null, doctorSpecialityId: number | null) {
  return (page: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (cityId !== null) params.set("city", String(cityId));
    if (doctorSpecialityId !== null) params.set("speciality", String(doctorSpecialityId));
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${getDoctorsUrl()}?${qs}` : getDoctorsUrl();
  };
}

/**
 * Nationwide `/doctors` listing — every active doctor across every city,
 * never implicitly scoped to the header's selected city. Reuses the
 * existing `DoctorCard` (already grid-safe, same precedent `HospitalCard`
 * set on the city Hospitals listing) in a plain responsive grid, same
 * structural shape as `BlogListingPage`, plus an optional filter bar
 * (search/city/speciality) that only ever NARROWS this same nationwide
 * set — it is never the source of the initial scope.
 */
export function DoctorListingPage({ listing, filterOptions, search, cityId, doctorSpecialityId }: DoctorListingPageProps) {
  const { items, page, totalPages, totalCount } = listing;
  const hasActiveFilter = Boolean(search) || cityId !== null || doctorSpecialityId !== null;

  return (
    <div className="public-container py-10 sm:py-12">
      <PublicBreadcrumb className="mb-4" items={[{ label: "Home", href: "/" }, { label: "Doctors" }]} />
      <h1 className="text-2xl font-black tracking-tight text-(--public-primary) sm:text-3xl">
        Find the Right Doctor for Your Care
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
        Browse experienced doctors and specialists across every Day Care Surgeries location — search by name, or
        narrow the list by city or speciality.
      </p>

      <DoctorListingFilters
        options={filterOptions}
        initialSearch={search}
        initialCityId={cityId}
        initialDoctorSpecialityId={doctorSpecialityId}
      />

      {items.length > 0 ? (
        <>
          <p className="mt-6 text-sm text-slate-500" role="status">
            {totalCount} doctor{totalCount === 1 ? "" : "s"} found
          </p>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        </>
      ) : (
        <div className="py-16 text-center text-slate-500" role="status">
          {hasActiveFilter ? (
            <>
              <p className="text-base font-medium text-slate-700">No doctors match your search or filters.</p>
              <p className="mt-1 text-sm">Try a different name, or clear the city/speciality filter.</p>
            </>
          ) : (
            <p>No doctors available yet.</p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 sm:mt-12">
          <ListingPagination page={page} totalPages={totalPages} buildHref={pageHref(search, cityId, doctorSpecialityId)} />
        </div>
      )}
    </div>
  );
}
