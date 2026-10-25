import { SectionHeader } from "@/components/public/shared/SectionHeader";
import type { PublicSpecialityDetail } from "@/lib/public/specialities";

type SpecialityTreatmentJourneyProps = {
  detail: PublicSpecialityDetail;
};

/**
 * Static, educational, general-purpose step outline — not CMS-driven (no
 * per-speciality journey data exists in the schema) and not medical
 * advice or an outcome guarantee. Deliberately generic enough to apply to
 * any speciality without overstating what happens for this one
 * specifically. Always renders.
 */
const STEPS = [
  { title: "Consultation", description: "Discuss your symptoms and history with a doctor mapped to this speciality." },
  { title: "Evaluation", description: "Relevant examinations help confirm what's actually going on before anything is decided." },
  { title: "Treatment Planning", description: "Your doctor talks through the options available and what each one involves." },
  { title: "Procedure / Treatment", description: "The agreed treatment is carried out at the coordinating hospital." },
  { title: "Recovery & Follow-up", description: "Post-treatment guidance and a follow-up check-in, so you're not left to figure things out alone." },
];

export function SpecialityTreatmentJourney({ detail }: SpecialityTreatmentJourneyProps) {
  return (
    <section aria-labelledby="speciality-journey-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <SectionHeader
        eyebrow="What To Expect"
        title={`The ${detail.name} treatment journey`}
        headingId="speciality-journey-heading"
        description="A general outline of how care typically progresses — your doctor may adjust these steps for your specific situation."
        align="center"
      />

      <ol className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((step, index) => (
          <li key={step.title} className="relative flex flex-col gap-3 rounded-(--public-radius-card) border border-slate-200 bg-white p-6">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(--public-primary) text-sm font-bold text-white">
              {index + 1}
            </span>
            <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
            <p className="text-sm leading-relaxed text-slate-600">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
