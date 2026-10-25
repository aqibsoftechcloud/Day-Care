import { doctorDisplayNameWithTitle, type PublicDoctorDetail } from "@/lib/public/doctors";
import { DoctorHero } from "./DoctorHero";
import { DoctorHighlights } from "./DoctorHighlights";
import { DoctorNavigation } from "./DoctorNavigation";
import { DoctorHospitals } from "./DoctorHospitals";
import { DoctorAbout } from "./DoctorAbout";
import { DoctorInfo } from "./DoctorInfo";
import { DoctorExpertise } from "./DoctorExpertise";
import { DoctorQualifications } from "./DoctorQualifications";
import { DoctorAvailability } from "./DoctorAvailability";
import { DoctorLocation, resolveDoctorDirectionsHref } from "./DoctorLocation";
import { DoctorAwards } from "./DoctorAwards";
import { DoctorFaqs } from "./DoctorFaqs";
import { DoctorFinalCta } from "./DoctorFinalCta";

type DoctorDetailPageProps = {
  detail: PublicDoctorDetail;
};

/**
 * Doctor Detail Page template. No appointment-management UI anywhere (no
 * product support for it exists). "Medical Registration" is deliberately
 * NOT rendered: `doctors` has no registration-number/council column at
 * all, and the brief only permits this section when real data exists.
 *
 * Awards and FAQs are real, doctor-specific CMS data (`doctor_awards`/
 * `doctor_faqs`, resolved in `lib/public/doctors.ts`), already filtered
 * to active-only records for this doctor. Each section (and its nav
 * item) hides itself when its own array is empty.
 */
export function DoctorDetailPage({ detail }: DoctorDetailPageProps) {
  const displayName = doctorDisplayNameWithTitle(detail.name);

  const hasDirections = resolveDoctorDirectionsHref(detail.locationMap, detail.latitude, detail.longitude) !== null;

  const navItems = [
    detail.about ? { id: "doctor-about-heading", label: "About" } : null,
    detail.hospitals.length > 0 ? { id: "doctor-hospitals-heading", label: "Hospitals" } : null,
    hasDirections ? { id: "doctor-location-heading", label: "Location" } : null,
    detail.awards.length > 0 ? { id: "doctor-awards-heading", label: "Awards" } : null,
    detail.faqs.length > 0 ? { id: "doctor-faqs-heading", label: "FAQs" } : null,
  ].filter((item): item is { id: string; label: string } => item !== null);

  return (
    <>
      <DoctorHero detail={detail} highlights={<DoctorHighlights detail={detail} embedded />} />
      <DoctorNavigation items={navItems} />
      <DoctorHospitals hospitals={detail.hospitals} />
      <DoctorAbout name={displayName} about={detail.about} />
      <DoctorInfo name={displayName} infoHtml={detail.docInfoHtml} />
      <DoctorExpertise name={displayName} specialities={detail.specialities} />
      <DoctorQualifications qualification={detail.qualification} />
      <DoctorAvailability
        availability={detail.availability}
        monSatFirstTimings={detail.monSatFirstTimings}
        monSatSecondTimings={detail.monSatSecondTimings}
        sundayTimings={detail.sundayTimings}
        timeInterval={detail.timeInterval}
      />
      <DoctorLocation
        locationMap={detail.locationMap}
        latitude={detail.latitude}
        longitude={detail.longitude}
        locationArea={detail.locationArea}
        cityName={detail.cityName}
      />
      <DoctorAwards awards={detail.awards} />
      <DoctorFaqs faqs={detail.faqs} />
      <DoctorFinalCta citySeoUrl={detail.citySeoUrl} />
    </>
  );
}
