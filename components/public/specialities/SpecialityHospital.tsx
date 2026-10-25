import { SectionHeader } from "@/components/public/shared/SectionHeader";
import { HospitalCard } from "@/components/public/home/HospitalCard";
import type { PublicSpecialityDetail } from "@/lib/public/specialities";

type SpecialityHospitalProps = {
  detail: PublicSpecialityDetail;
};

/**
 * The one hospital genuinely linked to this speciality
 * (`specialities.hospital_id`) — reuses the exact `HospitalCard` the
 * homepage's Hospitals section already renders, not a new card design.
 * A single card in a constrained-width column rather than a carousel:
 * there is at most one hospital here, so an Embla carousel would have
 * nothing to carousel through. Renders nothing when no hospital is
 * linked (or the linked one is inactive).
 */
export function SpecialityHospital({ detail }: SpecialityHospitalProps) {
  if (!detail.hospital) {
    return null;
  }

  return (
    <section aria-labelledby="speciality-hospital-heading" className="public-container py-16 sm:py-20">
      <SectionHeader eyebrow="Hospital" title={`Where ${detail.name} is available`} headingId="speciality-hospital-heading" />

      <div className="mt-10 max-w-sm sm:mt-12">
        <HospitalCard hospital={detail.hospital} />
      </div>
    </section>
  );
}
