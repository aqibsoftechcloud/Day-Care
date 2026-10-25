import { ShieldCheck } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import { ExpandableList } from "@/components/public/shared/ExpandableList";
import type { PublicHospitalInsurer } from "@/lib/public/hospitals";

type HospitalInsuranceProps = {
  insurers: PublicHospitalInsurer[];
};

const INITIAL_LIMIT = 6;

/**
 * "Insurance & Payment Support" — a 1/2-column grid of provider cards (logo/name left, Free Quote right), real data only
 * (`hospital_insurance_companies` → `insurance_companies`, active
 * mappings to active companies, ordered). "Free Quote" is a plain
 * interface label/affordance (no lead-capture endpoint exists for this
 * action yet), not hospital-specific content — the insurer name/logo
 * themselves are real. Initially shows 5 rows; `ExpandableList` reveals
 * the rest.
 */
export function HospitalInsurance({ insurers }: HospitalInsuranceProps) {
  if (insurers.length === 0) return null;

  return (
    <section
      id="hospital-insurance-heading"
      aria-labelledby="hospital-insurance-title"
      className="public-container scroll-mt-20 py-10 sm:py-12"
    >
      <SectionHeader eyebrow="Payments" title="Insurance & Payment Support" headingId="hospital-insurance-title" />

      <div className="mt-6">
        <ExpandableList
          items={insurers.map((insurer) => (
            <div
              key={insurer.id}
              className="flex items-center justify-between gap-4 rounded-(--public-radius-card) border border-slate-200 bg-white p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                {insurer.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded logo, unconstrained host.
                  <img src={insurer.logoUrl} alt="" className="size-10 shrink-0 rounded-full border border-slate-100 bg-white object-contain" />
                ) : (
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(--public-primary)/8 text-(--public-primary)">
                    <ShieldCheck className="size-4.5" aria-hidden="true" />
                  </span>
                )}
                <span className="line-clamp-2 min-w-0 text-sm font-medium break-words text-slate-800">{insurer.name}</span>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-md border border-(--public-primary)/20 px-3 py-1.5 text-xs font-semibold text-(--public-primary) transition-colors hover:border-(--public-accent)/40 hover:text-(--public-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
              >
                Free Quote
              </button>
            </div>
          ))}
          initialLimit={INITIAL_LIMIT}
          itemsClassName="grid grid-cols-1 gap-3 sm:grid-cols-2"
          moreLabel="View More Insurers"
        />
      </div>
    </section>
  );
}
