import { TreatmentCard } from "@/components/public/treatments/TreatmentCard";
import { ListingPagination } from "@/components/public/shared/ListingPagination";
import { AppointmentLeadForm } from "@/components/public/home/AppointmentLeadForm";
import { getTreatmentsUrl } from "@/lib/public/urls";
import type { PublicTreatmentListing } from "@/lib/public/treatments";
import { PublicBreadcrumb } from "@/components/public/shared/PublicBreadcrumb";

type TreatmentListingPageProps = {
  listing: PublicTreatmentListing;
};

function pageHref(page: number): string {
  return page <= 1 ? getTreatmentsUrl() : `${getTreatmentsUrl()}?page=${page}`;
}

/**
 * Nationwide `/treatments` listing — active Global Treatments ONLY
 * (`global_treatments`, via `resolvePublicTreatmentListing`). No city
 * data is ever queried here.
 *
 * Real two-column layout: listing content on the left, a single
 * `AppointmentLeadForm` instance in a native `position: sticky` sidebar
 * on the right. One column on mobile, no sticky behavior there.
 */
export function TreatmentListingPage({ listing }: TreatmentListingPageProps) {
  const { items, page, totalPages } = listing;

  return (
    <div className="public-container py-10 sm:py-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div>
          <PublicBreadcrumb className="mb-4" items={[{ label: "Home", href: "/" }, { label: "Treatments" }]} />
          <h1 className="text-2xl font-black tracking-tight text-(--public-primary) sm:text-3xl">Treatments</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
            Explore treatments offered across Day Care Surgeries.
          </p>

          {items.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:mt-10 sm:grid-cols-2">
              {items.map((treatment) => (
                <TreatmentCard key={treatment.id} treatment={treatment} />
              ))}
            </div>
          ) : (
            <p className="py-16 text-center text-slate-500">No treatments available yet.</p>
          )}

          {totalPages > 1 && (
            <div className="mt-10 sm:mt-12">
              <ListingPagination page={page} totalPages={totalPages} buildHref={pageHref} />
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <AppointmentLeadForm />
        </aside>
      </div>
    </div>
  );
}
