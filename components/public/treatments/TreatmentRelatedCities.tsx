import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import { ExpandableList } from "@/components/public/shared/ExpandableList";
import type { PublicTreatmentRelatedCity } from "@/lib/public/treatments";

const INITIAL_LIMIT = 5;

/**
 * Real cross-city name-match on `sub_speciality_name` — same heuristic
 * as Speciality's Related Cities. Renders nothing when no other city has
 * this treatment. Initially shows 5 — `ExpandableList` reveals the rest
 * on demand.
 */
export function TreatmentRelatedCities({ treatmentName, cities }: { treatmentName: string; cities: PublicTreatmentRelatedCity[] }) {
  if (cities.length === 0) return null;

  return (
    <section aria-labelledby="treatment-related-cities-heading" className="public-container py-8 sm:py-10 lg:pr-125">
      <SectionHeader
        eyebrow="Other Locations"
        title={`${treatmentName} in other cities`}
        headingId="treatment-related-cities-heading"
        align="center"
      />

      <div className="mt-6">
        <ExpandableList
          items={cities.map((city) => (
            <Link
              key={city.citySeoUrl}
              href={city.href}
              className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-(--public-primary) transition-colors hover:border-(--public-accent)/40 hover:text-(--public-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
            >
              <MapPin className="size-4 text-(--public-primary)/50 group-hover:text-(--public-accent)" aria-hidden="true" />
              {city.cityName}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          ))}
          initialLimit={INITIAL_LIMIT}
          itemsClassName="flex flex-wrap justify-center gap-3"
          moreLabel="View More Cities"
        />
      </div>
    </section>
  );
}
