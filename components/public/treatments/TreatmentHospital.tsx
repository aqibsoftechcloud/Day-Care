import { HospitalCard } from "@/components/public/home/HospitalCard";
import type { PublicTreatmentDetail } from "@/lib/public/treatments";

/**
 * Real `treatment.hospital_id` relationship (already existed on the
 * schema — no new FK was needed; the resolver's own `treatment.hospital`
 * is a single relation, never an array — there is no many-to-many
 * treatment/hospital join in this schema, so exactly one real card is
 * what renders today). Renders only `HospitalCard`(s) in the exact same
 * `grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3` layout
 * `HospitalListingPage.tsx` already uses for its own real multi-hospital
 * listing — reused here rather than a one-off card wrapper, so a single
 * card sizes to one normal grid cell (not full-width), and this stays
 * correct without changes if this relationship is ever extended to more
 * than one hospital. No separate standalone address or hardcoded
 * "offered at an equipped facility..." copy beside the card(s) — that's
 * the one thing this section used to render that shouldn't be here.
 * Renders nothing when no hospital is linked, or the linked one is
 * itself inactive.
 */
export function TreatmentHospital({
  treatmentName,
  hospital,
}: {
  treatmentName: string;
  hospital: PublicTreatmentDetail["hospital"];
}) {
  const hospitals = hospital ? [hospital] : [];

  if (hospitals.length === 0) return null;

  return (
    <section aria-labelledby="treatment-hospital-heading" className="public-container py-8 sm:py-10 lg:pr-125">
      <h2 id="treatment-hospital-heading" className="text-2xl font-bold text-slate-900 sm:text-[1.75rem]">
        Where {treatmentName} Is Available
      </h2>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {hospitals.map((h) => (
          <HospitalCard key={h.id} hospital={h} />
        ))}
      </div>
    </section>
  );
}
