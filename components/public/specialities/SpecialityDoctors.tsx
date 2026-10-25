import { SectionHeader } from "@/components/public/shared/SectionHeader";
import { DoctorCard } from "@/components/public/home/DoctorCard";
import type { PublicSpecialityDetail } from "@/lib/public/specialities";

type SpecialityDoctorsProps = {
  detail: PublicSpecialityDetail;
};

/**
 * Real active doctors mapped (via `doctor_speciality_mappings`) to this
 * speciality's linked `doctor_specialities` taxonomy row, scoped to this
 * speciality's own city (see `resolvePublicSpeciality`) — never every
 * doctor in the city. Reuses the homepage's standardized 4:3 `DoctorCard`
 * verbatim, same as every other doctor listing on the site. Renders
 * nothing when no taxonomy row is linked yet, or none is mapped.
 */
export function SpecialityDoctors({ detail }: SpecialityDoctorsProps) {
  if (detail.doctors.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="speciality-doctors-heading" className="public-container py-16 sm:py-20">
      <SectionHeader eyebrow="Our Doctors" title={`${detail.name} Specialists`} headingId="speciality-doctors-heading" />

      <div className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
        {detail.doctors.map((doctor) => (
          <DoctorCard key={doctor.id} doctor={doctor} />
        ))}
      </div>
    </section>
  );
}
