import { DoctorCard } from "@/components/public/home/DoctorCard";
import { ExpandableList } from "@/components/public/shared/ExpandableList";
import type { PublicTreatmentDoctor } from "@/lib/public/treatments";

const INITIAL_LIMIT = 3;

/**
 * Real doctors resolved via Treatment → Speciality →
 * `doctor_speciality_id` → Doctors, city-scoped to this treatment's own
 * city (see `resolvePublicTreatment`). Reuses the same `DoctorCard` every
 * other doctor listing on the site uses. Renders nothing when the parent
 * speciality has no linked taxonomy row, or none is mapped in this city.
 * Initially shows 3 — `ExpandableList` reveals the rest on demand; the
 * full `doctors` array is always received complete, never trimmed here.
 */
export function TreatmentDoctors({ treatmentName, doctors }: { treatmentName: string; doctors: PublicTreatmentDoctor[] }) {
  if (doctors.length === 0) return null;

  return (
    <section aria-labelledby="treatment-doctors-heading" className="public-container py-10 sm:py-12 lg:pr-125">
      <h2 id="treatment-doctors-heading" className="text-2xl font-bold text-slate-900 sm:text-[1.75rem]">
        Meet Our Best Doctors for {treatmentName}
      </h2>

      <div className="mt-6">
        <ExpandableList
          items={doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
          initialLimit={INITIAL_LIMIT}
          itemsClassName="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          moreLabel="View More Doctors"
        />
      </div>
    </section>
  );
}
