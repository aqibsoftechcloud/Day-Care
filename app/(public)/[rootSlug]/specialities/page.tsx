import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCityBySeoUrl } from "@/services/city.service";
import { resolvePublicCitySpecialityCards } from "@/lib/public/specialities";
import { getCitySpecialitiesUrl, getCityUrl } from "@/lib/public/urls";
import { buildPublicMetadata } from "@/lib/public/seo";
import { PublicHeader } from "@/components/public/layout/PublicHeader";
import { PublicFooter } from "@/components/public/layout/PublicFooter";
import { SpecialityCard } from "@/components/public/specialities/SpecialityCard";
import { PublicBreadcrumb } from "@/components/public/shared/PublicBreadcrumb";

type CitySpecialitiesPageProps = {
  params: Promise<{ rootSlug: string }>;
};

/**
 * `/{citySeoUrl}/specialities` — that city's own speciality listing, the
 * destination of the city homepage's "View All Specialities" card. Reads
 * the city's `specialities` rows only (the nationwide `/specialities`
 * reads `global_specialities`). Unknown city slug -> 404.
 */
export async function generateMetadata({ params }: CitySpecialitiesPageProps): Promise<Metadata> {
  const { rootSlug } = await params;
  const city = await getCityBySeoUrl(rootSlug);

  if (!city) {
    return {};
  }

  return buildPublicMetadata({
    title: `Specialities in ${city.city_name}`,
    description: `Explore the clinical specialities offered by Day Care Surgeries in ${city.city_name}.`,
    canonicalPath: getCitySpecialitiesUrl(city.seo_url),
  });
}

export default async function CitySpecialitiesRoute({ params }: CitySpecialitiesPageProps) {
  const { rootSlug } = await params;
  const city = await getCityBySeoUrl(rootSlug);

  if (!city || city.status !== "active") {
    notFound();
  }

  const specialities = await resolvePublicCitySpecialityCards(city.id);

  return (
    <>
      <PublicHeader currentCityId={city.id} />
      <main>
        <div className="public-container py-10 sm:py-12">
          <PublicBreadcrumb className="mb-4" items={[{ label: "Home", href: "/" }, { label: city.city_name, href: getCityUrl(city.seo_url) }, { label: "Specialities" }]} />
          <h1 className="text-2xl font-black tracking-tight text-(--public-primary) sm:text-3xl">
            Specialities in {city.city_name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
            Explore the clinical specialities offered by Day Care Surgeries in {city.city_name}.
          </p>

          {specialities.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
              {specialities.map((speciality) => (
                <SpecialityCard key={speciality.id} speciality={speciality} />
              ))}
            </div>
          ) : (
            <p className="py-16 text-center text-slate-500">No specialities available in {city.city_name} yet.</p>
          )}
        </div>
      </main>
      <PublicFooter currentCityId={city.id} />
    </>
  );
}
