import { getCityUrl } from "@/lib/public/urls";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCityBySeoUrl } from "@/services/city.service";
import { getHomepageHospitals } from "@/lib/public/homepage";
import { PublicHeader } from "@/components/public/layout/PublicHeader";
import { PublicFooter } from "@/components/public/layout/PublicFooter";
import { HospitalCard } from "@/components/public/home/HospitalCard";
import { PublicBreadcrumb } from "@/components/public/shared/PublicBreadcrumb";

type HospitalsListingPageProps = {
  params: Promise<{ rootSlug: string }>;
};

/**
 * `/{citySeoUrl}/hospitals` — the Hospital LISTING route. Was missing
 * entirely, so the "Hyderabad → For Patients → Hospitals" nav item (a CMS
 * `listing_key: "hospitals"` menu row, resolved via
 * `lib/public/menu.ts`'s `resolveMenuHref`) pointed at a dead URL.
 *
 * Deliberately minimal/structural per this task's own scope — proves the
 * route resolves and links through to the real (already-built, already-
 * locked) hospital detail route; NOT the finalized Hospital Listing Page
 * UI, which is a separate task. Reuses `getHomepageHospitals` (the exact
 * same public-safe, city-filtered hospital fetch the homepage's own
 * Hospitals section already uses) and the existing `HospitalCard` —
 * no new service, validator, or API route.
 */
export async function generateMetadata({ params }: HospitalsListingPageProps): Promise<Metadata> {
  const { rootSlug } = await params;
  const city = await getCityBySeoUrl(rootSlug);

  if (!city) {
    return {};
  }

  return { title: `Hospitals in ${city.city_name}` };
}

export default async function HospitalsListingRoute({ params }: HospitalsListingPageProps) {
  const { rootSlug } = await params;
  const city = await getCityBySeoUrl(rootSlug);

  if (!city) {
    notFound();
  }

  const hospitals = await getHomepageHospitals(city.id);

  return (
    <>
      <PublicHeader currentCityId={city.id} />
      <main>
        <section className="public-container py-10 sm:py-12">
          <PublicBreadcrumb className="mb-4" items={[{ label: "Home", href: "/" }, { label: city.city_name, href: getCityUrl(city.seo_url) }, { label: "Hospitals" }]} />
          <h1 className="text-2xl font-black tracking-tight text-(--public-primary) sm:text-3xl">
            Hospitals in {city.city_name}
          </h1>

          {hospitals.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">No hospitals are listed for {city.city_name} yet.</p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {hospitals.map((hospital) => (
                <HospitalCard key={hospital.id} hospital={hospital} />
              ))}
            </div>
          )}
        </section>
      </main>
      <PublicFooter currentCityId={city.id} />
    </>
  );
}
