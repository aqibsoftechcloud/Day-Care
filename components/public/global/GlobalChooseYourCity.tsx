import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import type { PublicGlobalCityLink } from "@/lib/public/global-content";

type GlobalChooseYourCityProps = {
  cities: PublicGlobalCityLink[];
};

/**
 * "Choose Your City" — the one place a city ever appears on a global
 * page, and only as a link out to that city's own real detail page
 * (`/[city]/treatments/{seoUrl}` or `/[city]/specialities/{seoUrl}`),
 * never as embedded content. Driven entirely by real, explicitly-linked,
 * active city rows (`treatments.global_treatment_id`/
 * `specialities.global_speciality_id`) — never hardcoded, never derived
 * by name-matching. Renders nothing when no city has been linked yet —
 * the global page still renders fully without this section (see
 * `GlobalDetailPage.tsx`).
 *
 * Card treatment (rather than the previous pill-link row) to read as this
 * page's "availability" section, consistent with the card-based visual
 * language every other listing on this site already uses (HospitalCard,
 * TreatmentCard, SpecialityCard).
 *
 * Deliberately no explicit background here (unlike the earlier version)
 * — `GlobalDetailPage.tsx`'s own `bg-slate-50` page base already shows
 * through, which is what creates the grey band between the white
 * Content panel above and the white FAQ/Blogs panels below, the same
 * "white panel on a grey page" rhythm `TreatmentHospital.tsx`'s own
 * "Where Treatment Is Available" section sits in on the city pages.
 */
export function GlobalChooseYourCity({ cities }: GlobalChooseYourCityProps) {
  if (cities.length === 0) return null;

  return (
    <section aria-labelledby="global-choose-city-heading">
      <div className="public-container py-10 sm:py-12">
        <SectionHeader eyebrow="Available Near You" title="Choose Your City" headingId="global-choose-city-heading" />

        <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((city) => (
            <Link
              key={city.citySeoUrl}
              href={city.href}
              className="group flex items-center justify-between gap-3 rounded-(--public-radius-card) border border-slate-200 bg-white px-5 py-5 transition-all hover:-translate-y-1 hover:border-(--public-accent)/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
            >
              <span className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--public-primary)/8 text-(--public-primary)">
                  <MapPin className="size-4.5" aria-hidden="true" />
                </span>
                <span className="text-base font-bold text-slate-900">{city.cityName}</span>
              </span>
              <ArrowRight
                className="size-4 shrink-0 text-(--public-accent) transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
