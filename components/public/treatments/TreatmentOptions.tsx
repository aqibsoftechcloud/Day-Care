import { CheckCircle2 } from "lucide-react";
import { ExpandableList } from "@/components/public/shared/ExpandableList";
import type { PublicTreatmentOptions } from "@/lib/public/treatments";

const INITIAL_LIMIT = 3;

/**
 * Real `treatment_sections` `options` content. Cards are substantial
 * (title + explanation + key points), not one-liners. The UI renders
 * however many items exist — never assumed to be exactly 3. Renders
 * nothing when the admin hasn't configured this section (`options` is
 * `null` whenever the row is empty/inactive). Initially shows 3 —
 * `ExpandableList` reveals the rest on demand; the full `items` array is
 * always received complete, never trimmed here.
 */
export function TreatmentOptions({ treatmentName, options }: { treatmentName: string; options: PublicTreatmentOptions }) {
  if (!options || options.items.length === 0) return null;

  return (
    <section aria-labelledby="treatment-options-heading" className="public-container py-8 sm:py-10 lg:pr-125">
      <h2 id="treatment-options-heading" className="text-2xl font-bold text-slate-900 sm:text-[1.75rem]">
        {options.heading || `Types of ${treatmentName}`}
      </h2>

      <div className="mt-6">
        <ExpandableList
          items={options.items.map((option) => (
            <div key={option.title} className="rounded-lg border border-slate-200 p-5 sm:p-6">
              <h3 className="text-base font-bold text-slate-900 sm:text-lg">{option.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{option.description}</p>
              {option.points.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1.5">
                  {option.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-(--public-accent)" aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          initialLimit={INITIAL_LIMIT}
          itemsClassName="grid grid-cols-1 gap-4 lg:grid-cols-3"
          moreLabel="View More Treatment Options"
        />
      </div>
    </section>
  );
}
