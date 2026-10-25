import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import type { PublicSpecialityDetail } from "@/lib/public/specialities";

type SpecialityRelatedCitiesProps = {
  detail: PublicSpecialityDetail;
};

/**
 * Other active cities that have their own active speciality row with the
 * exact same name (see `resolvePublicSpeciality`'s doc comment — a
 * name-based heuristic, the only cross-city signal this schema currently
 * has; never hardcoded). Renders nothing when no other city has this
 * speciality yet.
 */
export function SpecialityRelatedCities({ detail }: SpecialityRelatedCitiesProps) {
  if (detail.relatedCities.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="speciality-related-cities-heading" className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <SectionHeader
        eyebrow="Other Locations"
        title={`${detail.name} in other cities`}
        headingId="speciality-related-cities-heading"
        align="center"
      />

      <div className="mt-10 flex flex-wrap justify-center gap-3 sm:mt-12">
        {detail.relatedCities.map((city) => (
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
      </div>
    </section>
  );
}
