import type { PublicTreatmentLabelValueItem } from "@/lib/public/treatments";

/**
 * Real `treatment_sections` `facts` content (label/value pairs). Rendered
 * as a real bordered information table (header row + lined rows). Built
 * with stacked flex rows (not a literal `<table>`) so it never needs
 * horizontal scrolling on mobile. Renders nothing when the admin hasn't
 * configured any facts yet (never fabricated values).
 */
export function TreatmentFactsTable({ treatmentName, facts }: { treatmentName: string; facts: PublicTreatmentLabelValueItem[] }) {
  if (facts.length === 0) return null;

  return (
    <section aria-labelledby="treatment-facts-heading" className="public-container py-8 sm:py-10 lg:pr-125">
      <h2 id="treatment-facts-heading" className="text-2xl font-bold text-slate-900 sm:text-[1.75rem]">
        {treatmentName} at a Glance
      </h2>

      <div className="mt-5 max-w-240 overflow-hidden rounded-lg border border-slate-200">
        <div className="flex bg-slate-50 px-4 py-2.5 sm:px-5">
          <span className="w-2/5 text-xs font-bold tracking-wide text-slate-500 uppercase sm:w-1/2">Treatment Information</span>
          <span className="w-3/5 text-xs font-bold tracking-wide text-slate-500 uppercase sm:w-1/2">Details</span>
        </div>
        {facts.map((fact, index) => (
          <div key={fact.label} className={`flex px-4 py-3 sm:px-5 ${index !== facts.length - 1 ? "border-b border-slate-100" : ""}`}>
            <span className="w-2/5 text-sm font-semibold text-slate-700 sm:w-1/2">{fact.label}</span>
            <span className="w-3/5 text-sm text-slate-600 sm:w-1/2">{fact.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
