import { CheckCircle2 } from "lucide-react";
import type { PublicTreatmentEligibility } from "@/lib/public/treatments";

/**
 * Real `treatment_sections` `eligibility` content — an editorial block
 * (intro paragraph, indicator list, closing note), not tiny statistic
 * cards. Optional per treatment: renders nothing when the admin hasn't
 * configured this section (`eligibility` is `null` whenever the row is
 * empty/inactive).
 */
export function TreatmentEligibility({
  treatmentName,
  eligibility,
}: {
  treatmentName: string;
  eligibility: PublicTreatmentEligibility;
}) {
  if (!eligibility || eligibility.indicators.length === 0) return null;

  return (
    <section aria-labelledby="treatment-eligibility-heading" className="public-container py-8 sm:py-10 lg:pr-125">
      <h2 id="treatment-eligibility-heading" className="text-2xl font-bold text-slate-900 sm:text-[1.75rem]">
        {eligibility.heading || `Who Is a Candidate for ${treatmentName}?`}
      </h2>

      <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <p className="text-base leading-relaxed text-slate-700">{eligibility.intro}</p>
          {eligibility.note && (
            <p className="mt-5 border-l-2 border-slate-200 pl-4 text-sm text-slate-500 italic">{eligibility.note}</p>
          )}
        </div>

        <div>
          <p className="text-sm font-bold tracking-wide text-slate-500 uppercase">Possible indicators</p>
          <ul className="mt-2.5 flex flex-col gap-2">
            {eligibility.indicators.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700 sm:text-base">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-(--public-accent)" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
