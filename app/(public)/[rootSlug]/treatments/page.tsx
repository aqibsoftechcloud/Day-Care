import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCityBySeoUrl } from "@/services/city.service";
import { resolvePublicCityTreatmentCards } from "@/lib/public/treatments";
import { getCityTreatmentsUrl, getCityUrl } from "@/lib/public/urls";
import { buildPublicMetadata } from "@/lib/public/seo";
import { PublicHeader } from "@/components/public/layout/PublicHeader";
import { PublicFooter } from "@/components/public/layout/PublicFooter";
import { TreatmentCard } from "@/components/public/treatments/TreatmentCard";
import { PublicBreadcrumb } from "@/components/public/shared/PublicBreadcrumb";

type CityTreatmentsPageProps = {
  params: Promise<{ rootSlug: string }>;
};

/**
 * `/{citySeoUrl}/treatments` — that city's own treatment listing, the
 * destination of the city homepage's "View All Treatments" card. Reads the
 * city's `treatments` rows only (the nationwide `/treatments` reads
 * `global_treatments`). Unknown city slug -> 404.
 */
export async function generateMetadata({ params }: CityTreatmentsPageProps): Promise<Metadata> {
  const { rootSlug } = await params;
  const city = await getCityBySeoUrl(rootSlug);

  if (!city) {
    return {};
  }

  return buildPublicMetadata({
    title: `Treatments in ${city.city_name}`,
    description: `Explore the treatments offered by Day Care Surgeries in ${city.city_name}.`,
    canonicalPath: getCityTreatmentsUrl(city.seo_url),
  });
}

export default async function CityTreatmentsRoute({ params }: CityTreatmentsPageProps) {
  const { rootSlug } = await params;
  const city = await getCityBySeoUrl(rootSlug);

  if (!city || city.status !== "active") {
    notFound();
  }

  const treatments = await resolvePublicCityTreatmentCards(city.id);

  return (
    <>
      <PublicHeader currentCityId={city.id} />
      <main>
        <div className="public-container py-10 sm:py-12">
          <PublicBreadcrumb className="mb-4" items={[{ label: "Home", href: "/" }, { label: city.city_name, href: getCityUrl(city.seo_url) }, { label: "Treatments" }]} />
          <h1 className="text-2xl font-black tracking-tight text-(--public-primary) sm:text-3xl">
            Treatments in {city.city_name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
            Explore the treatments offered by Day Care Surgeries in {city.city_name}.
          </p>

          {treatments.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
              {treatments.map((treatment) => (
                <TreatmentCard key={treatment.id} treatment={treatment} />
              ))}
            </div>
          ) : (
            <p className="py-16 text-center text-slate-500">No treatments available in {city.city_name} yet.</p>
          )}
        </div>
      </main>
      <PublicFooter currentCityId={city.id} />
    </>
  );
}
