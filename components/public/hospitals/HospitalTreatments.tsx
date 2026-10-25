import Link from "next/link";
import { ArrowRight, Syringe } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import { ExpandableList } from "@/components/public/shared/ExpandableList";
import type { PublicHospitalTreatment } from "@/lib/public/hospitals";

type HospitalTreatmentsProps = {
  treatments: PublicHospitalTreatment[];
};

const INITIAL_LIMIT = 8;

/**
 * "Treatments Available" — one card per real TREATMENT this hospital
 * offers, in the same card style and responsive grid as "Specialities
 * Offered" (icon chip, name, short description, Learn More). Only
 * `treatments` records are rendered: the data
 * (`treatments.hospital_id`, resolved and de-duplicated in
 * lib/public/hospitals.ts) is never mixed with speciality rows, and there
 * are no speciality group headings. Each card links to the treatment's own
 * city detail page via the shared URL helper, and shows the treatment's own
 * `card_icon` when it has one, else the default treatment icon. With none,
 * a plain empty state is shown (never speciality names as a substitute).
 */
export function HospitalTreatments({ treatments }: HospitalTreatmentsProps) {
  return (
    <section
      id="hospital-treatments-heading"
      aria-labelledby="hospital-treatments-title"
      className="public-container scroll-mt-20 py-10 sm:py-12"
    >
      <SectionHeader eyebrow="Treatments" title="Treatments Available" headingId="hospital-treatments-title" />

      {treatments.length === 0 ? (
        <p className="mt-6 rounded-(--public-radius-card) border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
          No treatments are listed for this hospital yet.
        </p>
      ) : (
        <div className="mt-6">
          <ExpandableList
            items={treatments.map((treatment) => (
              <Link
                key={treatment.id}
                href={treatment.href}
                className="group flex h-full flex-col gap-3 rounded-(--public-radius-card) border border-slate-200 bg-white p-5 transition-colors hover:border-(--public-accent)/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
              >
                <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--public-primary)/8 text-(--public-primary)">
                  {treatment.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- small admin-uploaded card icon (same-origin /uploads).
                    <img src={treatment.iconUrl} alt="" className="size-6 object-contain" />
                  ) : (
                    <Syringe className="size-5" aria-hidden="true" />
                  )}
                </span>
                <h3 className="text-sm font-bold break-words text-slate-900">{treatment.name}</h3>
                {treatment.shortDescription && (
                  <p className="line-clamp-3 text-sm leading-relaxed text-slate-500">{treatment.shortDescription}</p>
                )}
                <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-semibold text-(--public-primary) transition-colors group-hover:text-(--public-accent)">
                  Learn More
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            ))}
            initialLimit={INITIAL_LIMIT}
            itemsClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            moreLabel="View All Treatments"
          />
        </div>
      )}
    </section>
  );
}
