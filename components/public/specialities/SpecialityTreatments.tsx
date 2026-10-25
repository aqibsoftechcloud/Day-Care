import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Syringe } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import type { PublicSpecialityDetail } from "@/lib/public/specialities";

type SpecialityTreatmentsProps = {
  detail: PublicSpecialityDetail;
};

/**
 * Only treatments with a genuine `treatments.speciality_id` FK pointing
 * at this speciality (see `resolvePublicSpeciality`) — never every
 * treatment in the city. Each links to the real, existing treatment
 * detail URL (`getTreatmentUrl`, already city-prefixed — backed by an
 * actual route, see app/(public)/[rootSlug]/treatments/[treatmentSeoUrl]).
 * Icon/short description render only when the CMS record actually has
 * them (`card_icon`/`short_description` on `treatments` — the dedicated card icon, never the hero image) — never
 * fabricated placeholders.
 *
 * Compact horizontal cards — fixed square image on the LEFT, title +
 * arrow row + description on the RIGHT — arranged in a responsive grid
 * (1/2/3 columns), never a full-width banner row. Image position is
 * fixed at every breakpoint including mobile; it never moves to the top
 * or right. Renders nothing when no such relationship exists.
 */
export function SpecialityTreatments({ detail }: SpecialityTreatmentsProps) {
  if (detail.treatments.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="speciality-treatments-heading" className="public-container py-16 sm:py-20">
      <SectionHeader
        eyebrow="Treatments"
        title={`Treatments for ${detail.name}`}
        headingId="speciality-treatments-heading"
      />

      <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
        {detail.treatments.map((treatment) => (
          <Link
            key={treatment.href}
            href={treatment.href}
            className="group flex items-center gap-4 rounded-(--public-radius-card) border border-slate-200 bg-white p-3 transition-all hover:border-(--public-accent)/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
          >
            <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-(--public-primary)/5 p-2">
              {treatment.imageUrl ? (
                <Image
                  src={treatment.imageUrl}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-(--public-primary)/8 to-(--public-primary)/3">
                  <Syringe className="size-6 text-(--public-primary)/30" aria-hidden="true" />
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-base font-bold text-slate-900">{treatment.name}</h3>
                <ArrowRight
                  className="size-4 shrink-0 text-(--public-accent) transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </div>
              {treatment.shortDescription && (
                <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">{treatment.shortDescription}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
