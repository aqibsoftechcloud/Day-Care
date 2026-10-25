import Link from "next/link";
import { ArrowRight, Stethoscope } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import type { PublicGlobalChildTreatment } from "@/lib/public/global-content";

type GlobalRelatedTreatmentsProps = {
  treatments: PublicGlobalChildTreatment[];
};

/**
 * "Treatments Under This Speciality" — only ever rendered on a global
 * SPECIALITY page (`detail.kind === "speciality"`; a treatment's own
 * `relatedTreatments` is always `[]`). Driven entirely by real, explicit
 * `global_treatments.global_speciality_id` links — never name-matched,
 * never derived from a city row. Renders nothing when no treatment has
 * been linked yet, same "render nothing, never a fabricated fallback"
 * convention `GlobalChooseYourCity.tsx` already follows; card styling
 * mirrors that component exactly.
 */
export function GlobalRelatedTreatments({ treatments }: GlobalRelatedTreatmentsProps) {
  if (treatments.length === 0) return null;

  return (
    <section aria-labelledby="global-related-treatments-heading" className="bg-white public-container py-8 sm:py-10">
      <SectionHeader
        eyebrow="Explore"
        title="Treatments Under This Speciality"
        headingId="global-related-treatments-heading"
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {treatments.map((treatment) => (
          <Link
            key={treatment.href}
            href={treatment.href}
            className="group flex items-center justify-between gap-3 rounded-(--public-radius-card) border border-slate-200 bg-white px-5 py-5 transition-all hover:-translate-y-1 hover:border-(--public-accent)/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
          >
            <span className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--public-primary)/8 text-(--public-primary)">
                <Stethoscope className="size-4.5" aria-hidden="true" />
              </span>
              <span className="text-base font-bold text-slate-900">{treatment.name}</span>
            </span>
            <ArrowRight
              className="size-4 shrink-0 text-(--public-accent) transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
