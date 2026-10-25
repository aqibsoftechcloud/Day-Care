import type { PublicTreatmentLabelValueItem } from "@/lib/public/treatments";

/**
 * Real `treatment_sections` `highlights` content (label/value pairs) — a
 * dense medical information strip (label over value, thin vertical
 * dividers), deliberately NOT a row of cards. Renders nothing when the
 * admin hasn't configured any items yet (never fabricated values).
 */
export function TreatmentHighlights({ items }: { items: PublicTreatmentLabelValueItem[] }) {
  if (items.length === 0) return null;

  return (
    // `lg:pr-125` on this wrapper, not the inner `!px-0` one — that inner
    // div zeroes its own padding with `!important`, which would also
    // block a `pr-*` utility added there. Same reserved-gutter value as
    // every other sticky-zone section, so this strip's grid doesn't run
    // under the Hero's sticky `AppointmentLeadForm` overlay either.
    <div className="relative z-10 -mt-6 px-4 sm:px-6 lg:px-8 lg:pr-125">
      <div className="public-container !px-0">
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm sm:grid-cols-5 sm:divide-y-0">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col gap-0.5 px-4 py-3 text-center sm:px-3">
              <span className="text-[0.6875rem] font-semibold tracking-wide text-slate-400 uppercase">{item.label}</span>
              <span className="text-sm font-bold text-(--public-primary) sm:text-[0.9375rem]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
