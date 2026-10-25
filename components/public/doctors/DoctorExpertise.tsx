import { CheckCircle2 } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import type { PublicDoctorSpeciality } from "@/lib/public/doctors";

type DoctorExpertiseProps = {
  /** Pre-formatted display name (e.g. "Dr. Arjun Reddy") — see `DoctorAbout`'s identical prop for why this is computed once by the shared server-rendered caller rather than here. */
  name: string;
  specialities: PublicDoctorSpeciality[];
};

/**
 * "Dr. [Name] is known for" — the doctor taxonomy only
 * (`doctor_speciality_mappings` → `doctor_specialities`), the same real
 * relationship already shown as badges in the Hero. Deliberately NOT the
 * clinical `specialities` CMS entity — see lib/public/doctors.ts's own
 * doc comment on keeping these two concepts distinct.
 */
export function DoctorExpertise({ name, specialities }: DoctorExpertiseProps) {
  if (specialities.length === 0) return null;

  return (
    <section
      id="doctor-expertise-heading"
      aria-labelledby="doctor-expertise-title"
      className="bg-slate-50"
    >
      <div className="public-container py-6 sm:py-8">
        <SectionHeader compact eyebrow="Expertise" title={`${name} is known for`} headingId="doctor-expertise-title" />

        <ul className="mt-3 flex flex-wrap gap-2">
          {specialities.map((speciality) => (
            <li
              key={speciality.id}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800"
            >
              <CheckCircle2 className="size-4 text-(--public-accent)" aria-hidden="true" />
              {speciality.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
