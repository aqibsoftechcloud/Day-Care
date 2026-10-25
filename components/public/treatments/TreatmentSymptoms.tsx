import Image from "next/image";
import { Activity } from "lucide-react";
import type { PublicTreatmentDetail } from "@/lib/public/treatments";

type TreatmentSymptomsProps = {
  detail: PublicTreatmentDetail;
};

/** Real `treatment_symptoms` data — doubles as "When Is Treatment Required?" per the locked mapping (the data-backed part of that section; any additional explanatory copy is a `custom` section in Phase 3). Compact chip list, article width, plain heading. */
export function TreatmentSymptoms({ detail }: TreatmentSymptomsProps) {
  if (detail.symptoms.length === 0) return null;

  return (
    <section aria-labelledby="treatment-symptoms-heading" className="public-container py-8 sm:py-10 lg:pr-125">
      <h2 id="treatment-symptoms-heading" className="text-2xl font-bold text-slate-900 sm:text-[1.75rem]">
        Conditions Associated with {detail.name}
      </h2>
      <div className="mt-5 flex flex-wrap gap-2.5">
        {detail.symptoms.map((symptom) => (
          <div
            key={symptom.name}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2"
          >
            <span className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--public-primary)/8 text-(--public-primary)">
              {symptom.imageUrl ? (
                <Image src={symptom.imageUrl} alt="" fill sizes="24px" className="object-cover" />
              ) : (
                <Activity className="size-3.5" aria-hidden="true" />
              )}
            </span>
            <span className="text-sm font-medium text-slate-800">{symptom.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
