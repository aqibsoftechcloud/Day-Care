import Image from "next/image";
import { Activity } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import type { PublicSpecialityDetail } from "@/lib/public/specialities";

type SpecialitySymptomsProps = {
  detail: PublicSpecialityDetail;
};

/**
 * Real active `speciality_symptoms` rows only, in their CMS `sorting_order`
 * (`getSpecialitySymptoms` already orders this way — no re-sort here). A
 * card grid rather than a pill list, matching the CMS-available fields:
 * `speciality_symptoms` has only `name` and `image` (no description, no
 * link/destination column — confirmed by reading the schema), so cards
 * show those two fields only and are never links. Renders nothing when
 * there are no active symptoms.
 */
export function SpecialitySymptoms({ detail }: SpecialitySymptomsProps) {
  if (detail.symptoms.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="speciality-symptoms-heading" className="public-container py-16 sm:py-20">
      <SectionHeader
        eyebrow="Conditions & Symptoms"
        title={`Conditions associated with ${detail.name}`}
        headingId="speciality-symptoms-heading"
      />

      <div className="mt-10 grid grid-cols-2 gap-4 sm:mt-12 sm:grid-cols-3 lg:grid-cols-4">
        {detail.symptoms.map((symptom) => (
          <div
            key={symptom.id}
            className="flex flex-col items-center gap-3 rounded-(--public-radius-card) border border-slate-200 bg-white px-4 py-6 text-center"
          >
            <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--public-primary)/8">
              {symptom.imageUrl ? (
                <Image src={symptom.imageUrl} alt="" fill sizes="48px" className="object-cover" />
              ) : (
                <Activity className="size-5 text-(--public-primary)/50" aria-hidden="true" />
              )}
            </span>
            <span className="text-sm font-semibold text-slate-900">{symptom.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
