import { SectionHeader } from "@/components/public/shared/SectionHeader";
import { ExpandableList } from "@/components/public/shared/ExpandableList";
import { DoctorCard } from "@/components/public/home/DoctorCard";
import type { PublicHospitalDoctor } from "@/lib/public/hospitals";

type HospitalDoctorsProps = {
  doctors: PublicHospitalDoctor[];
  hospitalName: string;
};

const INITIAL_LIMIT = 3;

/**
 * "Our Doctors" — reuses the real `DoctorCard` (same card the homepage's
 * carousel and the Treatment/Speciality Doctors sections already render),
 * not a new card design.
 *
 * Real data only — `doctor_hospitals`, resolved via
 * `getDoctorsByHospital()` in lib/public/hospitals.ts, never inferred
 * from city. `href` uses the same `getDoctorUrl()` builder
 * Treatment/Speciality's own Doctors sections already use — no public
 * Doctor detail route exists yet anywhere in the app (confirmed: no
 * matching file under `app/(public)/`), so this link currently 404s,
 * exactly like it already does on those two existing, locked pages. Not
 * routed around here — same pre-existing gap, not something this task
 * introduces or should silently fix with a placeholder anchor.
 */
export function HospitalDoctors({ doctors, hospitalName }: HospitalDoctorsProps) {
  if (doctors.length === 0) return null;

  return (
    <section
      id="hospital-doctors-heading"
      aria-labelledby="hospital-doctors-title"
      className="public-container scroll-mt-20 py-10 sm:py-12"
    >
      <SectionHeader eyebrow="Our Team" title="Our Doctors" headingId="hospital-doctors-title" />

      <div className="mt-6">
        <ExpandableList
          items={doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={{
                id: doctor.id,
                name: doctor.name,
                qualification: doctor.qualification,
                experience: doctor.experience,
                satisfactionScore: doctor.satisfactionScore,
                imageUrl: doctor.imageUrl,
                href: doctor.href,
                specialityName: doctor.specialityName,
                hospitalName,
              }}
            />
          ))}
          initialLimit={INITIAL_LIMIT}
          itemsClassName="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          moreLabel="View More Doctors"
        />
      </div>
    </section>
  );
}
