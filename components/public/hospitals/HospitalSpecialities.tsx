import Link from "next/link";
import { ArrowRight, Stethoscope } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import type { PublicHospitalSpeciality } from "@/lib/public/hospitals";

type HospitalSpecialitiesProps = {
  specialities: PublicHospitalSpeciality[];
};

/**
 * "Specialities Offered" — compact horizontal cards, 3-4 visible at once.
 * A plain responsive grid rather than a carousel: the real data set here
 * is small enough (a handful of specialities per hospital) that a
 * carousel would have little to carousel through — same reasoning
 * SpecialityHospital.tsx used to skip a carousel for a single card.
 *
 * Real data only — `specialities.hospital_id`, resolved in
 * lib/public/hospitals.ts, never inferred from city. The only adapter
 * change from the Phase 1 mock version: the card is now a real `<Link>`
 * to the speciality's own detail page (the mock had no href at all),
 * and the description is whatever real `short_description` the
 * speciality has, which can be empty.
 */
export function HospitalSpecialities({ specialities }: HospitalSpecialitiesProps) {
  if (specialities.length === 0) return null;

  return (
    <section
      id="hospital-specialities-heading"
      aria-labelledby="hospital-specialities-title"
      className="public-container scroll-mt-20 py-10 sm:py-12"
    >
      <SectionHeader eyebrow="Specialities" title="Specialities Offered" headingId="hospital-specialities-title" />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {specialities.map((speciality) => (
          <Link
            key={speciality.id}
            href={speciality.href}
            className="group flex flex-col gap-3 rounded-(--public-radius-card) border border-slate-200 bg-white p-5 transition-colors hover:border-(--public-accent)/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--public-primary)/8 text-(--public-primary)">
              <Stethoscope className="size-5" aria-hidden="true" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">{speciality.name}</h3>
            {speciality.shortDescription && (
              <p className="line-clamp-3 text-sm leading-relaxed text-slate-500">{speciality.shortDescription}</p>
            )}
            <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-semibold text-(--public-primary) transition-colors group-hover:text-(--public-accent)">
              Learn More
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
