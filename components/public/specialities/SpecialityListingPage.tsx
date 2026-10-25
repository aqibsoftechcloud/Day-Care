import { SpecialityCard } from "@/components/public/specialities/SpecialityCard";
import { ListingPagination } from "@/components/public/shared/ListingPagination";
import { getSpecialitiesUrl } from "@/lib/public/urls";
import type { PublicSpecialityListing } from "@/lib/public/specialities";
import { PublicBreadcrumb } from "@/components/public/shared/PublicBreadcrumb";

type SpecialityListingPageProps = {
  listing: PublicSpecialityListing;
};

function pageHref(page: number): string {
  return page <= 1 ? getSpecialitiesUrl() : `${getSpecialitiesUrl()}?page=${page}`;
}

/**
 * Nationwide `/specialities` listing — active Global Specialities ONLY
 * (`global_specialities`). Mirrors `TreatmentListingPage` exactly — see
 * that file's own doc comment for why an empty result today is correct,
 * expected behavior, not a bug.
 */
export function SpecialityListingPage({ listing }: SpecialityListingPageProps) {
  const { items, page, totalPages } = listing;

  return (
    <div className="public-container py-10 sm:py-12">
      <PublicBreadcrumb className="mb-4" items={[{ label: "Home", href: "/" }, { label: "Specialities" }]} />
      <h1 className="text-2xl font-black tracking-tight text-(--public-primary) sm:text-3xl">Specialities</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
        Explore clinical specialities offered across Day Care Surgeries.
      </p>

      {items.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 sm:mt-10">
          {items.map((speciality) => (
            <SpecialityCard key={speciality.id} speciality={speciality} />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-slate-500">No specialities available yet.</p>
      )}

      {totalPages > 1 && (
        <div className="mt-10 sm:mt-12">
          <ListingPagination page={page} totalPages={totalPages} buildHref={pageHref} />
        </div>
      )}
    </div>
  );
}
