import type { PublicSpecialityDetail, PublicSpecialitySectionItem } from "@/lib/public/specialities";
import { SpecialityHero } from "./SpecialityHero";
import { SpecialityOverview } from "./SpecialityOverview";
import { SpecialitySymptoms } from "./SpecialitySymptoms";
import { SpecialityTreatments } from "./SpecialityTreatments";
import { SpecialityWhyChooseUs } from "./SpecialityWhyChooseUs";
import { SpecialityDoctors } from "./SpecialityDoctors";
import { SpecialityHospital } from "./SpecialityHospital";
import { SpecialityTestimonials } from "./SpecialityTestimonials";
import { SpecialityFaq } from "./SpecialityFaq";
import { SpecialityBlogs } from "./SpecialityBlogs";
import { SpecialityRelatedCities } from "./SpecialityRelatedCities";
import { SpecialityFinalCta } from "./SpecialityFinalCta";
import { CustomContentSection } from "./CustomContentSection";

type SpecialityDetailPageProps = {
  detail: PublicSpecialityDetail;
};

/**
 * The one reusable template every active speciality renders through — no
 * per-speciality branching, no hardcoded copy for any one speciality
 * (Proctology is only ever this template's test data, never a special
 * case in the code).
 *
 * Section order is now fully CMS-driven: `detail.sections` (built by
 * `buildSpecialitySectionOrder` in lib/public/specialities.ts) already
 * carries every fixed CMS type (including `why_choose_us`, itself now
 * CMS-controlled per speciality — see SpecialityWhyChooseUs.tsx), every
 * active custom section, and the 3 remaining non-CMS static sections in
 * their final render order — this component just dispatches each item to
 * its matching component via `switch`, in that exact order. Each fixed
 * component still independently self-hides when its own underlying data
 * is empty. Only `custom` is rendered generically via
 * `CustomContentSection` — never a per-speciality/per-section component.
 *
 * `cta` is deliberately NOT part of `detail.sections` — it's rendered
 * separately here, always last, exactly matching its own explicit
 * "always last" requirement (a Final CTA followed by more sections would
 * defeat its purpose); `detail.ctaEnabled` still hides it entirely when
 * the admin disabled it.
 */
export function SpecialityDetailPage({ detail }: SpecialityDetailPageProps) {
  return (
    <>
      {detail.sections.map((section) => (
        <SpecialitySectionDispatcher key={sectionKey(section)} section={section} detail={detail} />
      ))}
      {detail.ctaEnabled && <SpecialityFinalCta detail={detail} />}
    </>
  );
}

function sectionKey(section: PublicSpecialitySectionItem): string {
  return section.kind === "custom" ? `custom-${section.id}` : section.kind;
}

function SpecialitySectionDispatcher({
  section,
  detail,
}: {
  section: PublicSpecialitySectionItem;
  detail: PublicSpecialityDetail;
}) {
  switch (section.kind) {
    case "hero":
      return <SpecialityHero detail={detail} />;
    case "overview":
      return <SpecialityOverview detail={detail} />;
    case "treatments":
      return <SpecialityTreatments detail={detail} />;
    case "symptoms":
      return <SpecialitySymptoms detail={detail} />;
    case "doctors":
      return <SpecialityDoctors detail={detail} />;
    case "hospital":
      return <SpecialityHospital detail={detail} />;
    case "faqs":
      return <SpecialityFaq detail={detail} />;
    case "custom":
      return <CustomContentSection section={section} />;
    case "why_choose_us":
      return <SpecialityWhyChooseUs detail={detail} />;
    case "testimonials":
      return <SpecialityTestimonials detail={detail} />;
    case "relatedCities":
      return <SpecialityRelatedCities detail={detail} />;
    case "blogs":
      return <SpecialityBlogs detail={detail} />;
  }
}
