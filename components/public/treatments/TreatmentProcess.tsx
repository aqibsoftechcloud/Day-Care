import type { PublicTreatmentProcess } from "@/lib/public/treatments";

/**
 * Real `treatment_sections` `process` content — a numbered editorial
 * list (01, 02, 03…), distinct from the Journey timeline below. Renders
 * nothing when the admin hasn't configured this section (`process` is
 * `null` whenever the row is empty/inactive).
 */
export function TreatmentProcess({ treatmentName, process }: { treatmentName: string; process: PublicTreatmentProcess }) {
  if (!process || process.items.length === 0) return null;

  const steps = process.items;

  return (
    <section aria-labelledby="treatment-process-heading" className="public-container py-8 sm:py-10 lg:pr-125">
      <h2 id="treatment-process-heading" className="text-2xl font-bold text-slate-900 sm:text-[1.75rem]">
        {process.heading || `How ${treatmentName} Works`}
      </h2>

      <div className="mt-6 grid grid-cols-1 gap-x-10 gap-y-1 lg:grid-cols-2">
        {steps.map((step, index) => {
          const isRightColumn = index % 2 === 1;
          return (
            <div
              key={step.title}
              className={`flex gap-5 py-5 ${isRightColumn ? "lg:pl-10" : "lg:pr-10 lg:border-r lg:border-slate-100"}`}
            >
              <span className="shrink-0 text-2xl font-black text-slate-200 tabular-nums sm:text-3xl">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 sm:text-lg">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 sm:text-base">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
