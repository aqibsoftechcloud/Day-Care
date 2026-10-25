import Link from "next/link";
import { ArrowRight, Building2, Stethoscope } from "lucide-react";
import { getPublicCities } from "@/lib/public/cities";
import { getHomepageTrustStats } from "@/lib/public/homepage";
import { getCachedLocationIconComponents } from "@/lib/public/homepage-icons";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import { HomepageIconGlyph } from "./HomepageIconGlyph";

/**
 * "Our Locations" — real active cities only (`getPublicCities()`, the
 * same resolver the header's own city selector already uses — no second
 * city list). Each card's small stat row reuses `getHomepageTrustStats`
 * per city (the identical function the Trust Strip calls), so a
 * "3 Specialities · 1 Hospital"-style line is real data, not invented.
 * Each card's icon is resolved against THAT city's own id (its own CMS
 * override, else the shared global default — see
 * `getCachedLocationIconComponents`'s own doc comment) — identical
 * regardless of which homepage (`/`, `/hyderabad`, `/mumbai`, …) renders
 * this grid, since the section itself always lists every active city.
 *
 * No India map: confirmed during the Advanced Homepage Redesign audit
 * that no map asset/library exists anywhere in this project. Per the
 * explicit instruction not to install a dependency or fabricate one for
 * this task, this renders as a clean location-card list instead — the
 * map asset itself is a reported gap, not something worked around here.
 */
export async function OurLocationsSection() {
  const cities = await getPublicCities();

  if (cities.length === 0) {
    return null;
  }

  const [citiesWithStats, locationIcons] = await Promise.all([
    Promise.all(
      cities.map(async (city) => ({
        ...city,
        stats: await getHomepageTrustStats(city.id),
      }))
    ),
    getCachedLocationIconComponents(cities.map((city) => city.id)),
  ]);

  return (
    <section aria-labelledby="locations-heading" className="public-container py-16 sm:py-20 lg:py-24">
      <SectionHeader
        eyebrow="Our Locations"
        title="Find Day Care Surgeries Near You"
        headingId="locations-heading"
        description="We currently serve the following cities — each with its own associated hospitals, specialists, and treatments."
        align="center"
      />

      <div className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
        {citiesWithStats.map((city) => {
          const locationIcon = locationIcons[city.id];
          return (
          <Link
            key={city.id}
            href={city.href}
            className="group flex flex-col gap-4 rounded-(--public-radius-card) border border-slate-200 bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:border-(--public-accent)/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-(--color-icon-border) bg-(--color-icon-background) text-(--color-icon-foreground)">
                <HomepageIconGlyph icon={locationIcon} className="size-5" />
              </span>
              <h3 className="text-lg font-bold text-slate-900">{city.name}</h3>
            </div>

            {(city.stats.hospitalsCount > 0 || city.stats.specialitiesCount > 0) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-500">
                {city.stats.hospitalsCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="size-4 text-(--public-primary)/50" aria-hidden="true" />
                    {city.stats.hospitalsCount} {city.stats.hospitalsCount === 1 ? "Hospital" : "Hospitals"}
                  </span>
                )}
                {city.stats.specialitiesCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Stethoscope className="size-4 text-(--public-primary)/50" aria-hidden="true" />
                    {city.stats.specialitiesCount} {city.stats.specialitiesCount === 1 ? "Speciality" : "Specialities"}
                  </span>
                )}
              </div>
            )}

            <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-semibold text-(--public-primary) transition-colors group-hover:text-(--public-accent)">
              Explore {city.name}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </Link>
          );
        })}
      </div>
    </section>
  );
}
