import type { PublicHospitalDetail } from "@/lib/public/hospitals";
import { HospitalHero } from "./HospitalHero";
import { HospitalTabs } from "./HospitalTabs";
import { HospitalAbout } from "./HospitalAbout";
import { HospitalGallery } from "./HospitalGallery";
import { HospitalSpecialities } from "./HospitalSpecialities";
import { HospitalTreatments } from "./HospitalTreatments";
import { HospitalDoctors } from "./HospitalDoctors";
import { HospitalWhyChooseUs } from "./HospitalWhyChooseUs";
import { HospitalInsurance } from "./HospitalInsurance";
import { HospitalConsultCta } from "./HospitalConsultCta";
import { HospitalReviews } from "./HospitalReviews";

type HospitalDetailPageProps = {
  detail: PublicHospitalDetail;
};

/**
 * Hospital Detail Page template — fixed section order per the locked
 * brief. 100% CMS/database-driven: every section reads from the real
 * `PublicHospitalDetail` resolver output (lib/public/hospitals.ts) —
 * `hospitals` core fields, `specialities.hospital_id`,
 * `treatments.hospital_id`, `doctor_hospitals`, `testimonials.hospital_id`,
 * `hospital_faqs`, `hospital_sections` (Why Choose Us / CTA),
 * `gallery.hospital_id`, and `hospital_insurance_companies` →
 * `insurance_companies`. No `hospital-demo-content.ts` mock import
 * anywhere in this component tree.
 */
export function HospitalDetailPage({ detail }: HospitalDetailPageProps) {
  return (
    <>
      <HospitalHero detail={detail} />
      <HospitalTabs />
      <HospitalAbout about={detail.shortDescription} />
      <HospitalGallery images={detail.gallery} />
      <HospitalSpecialities specialities={detail.specialities} />
      <HospitalTreatments treatments={detail.treatments} />
      <HospitalDoctors doctors={detail.doctors} hospitalName={detail.name} />
      <HospitalWhyChooseUs hospitalName={detail.name} whyChooseUs={detail.whyChooseUs} />
      <HospitalInsurance insurers={detail.insurers} />
      {detail.ctaEnabled && <HospitalConsultCta hospitalName={detail.name} cta={detail.cta} />}
      <HospitalReviews reviews={detail.reviews} />
    </>
  );
}
