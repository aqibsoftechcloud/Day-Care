import { TreatmentHero } from "./TreatmentHero";
import { TreatmentHighlights } from "./TreatmentHighlights";
import { TreatmentOverview } from "./TreatmentOverview";
import { TreatmentSymptoms } from "./TreatmentSymptoms";
import { TreatmentMedicalIllustration } from "./TreatmentMedicalIllustration";
import { TreatmentFactsTable } from "./TreatmentFactsTable";
import { TreatmentInlineCta } from "./TreatmentInlineCta";
import { TreatmentContentBlock } from "./TreatmentContentBlock";
import { TreatmentOptions } from "./TreatmentOptions";
import { TreatmentEligibility } from "./TreatmentEligibility";
import { TreatmentWhyChooseUs } from "./TreatmentWhyChooseUs";
import { TreatmentDoctors } from "./TreatmentDoctors";
import { TreatmentProcess } from "./TreatmentProcess";
import { TreatmentJourney } from "./TreatmentJourney";
import { TreatmentHospital } from "./TreatmentHospital";
import { TreatmentPreparationRecovery } from "./TreatmentPreparationRecovery";
import { TreatmentFaq } from "./TreatmentFaq";
import { TreatmentRelatedTreatments } from "./TreatmentRelatedTreatments";
import { TreatmentRelatedSpeciality } from "./TreatmentRelatedSpeciality";
import { TreatmentRelatedCities } from "./TreatmentRelatedCities";
import { TreatmentBlogs } from "./TreatmentBlogs";
import { TreatmentFinalCta } from "./TreatmentFinalCta";
import { AppointmentLeadForm } from "@/components/public/home/AppointmentLeadForm";
import { getContactUsUrl } from "@/lib/public/urls";
import type { PublicTreatmentDetail, PublicTreatmentSectionItem } from "@/lib/public/treatments";

type TreatmentDetailPageProps = {
  detail: PublicTreatmentDetail;
};

/**
 * PHASE 2 — CMS-driven. Section order is now fully data-driven
 * (`detail.sections`, built by `buildTreatmentSectionOrder` in
 * `lib/public/treatments.ts`), mirroring `SpecialityDetailPage.tsx`'s own
 * `sections.map(...)` dispatcher exactly — same convention, fully
 * independent `treatment_sections` data source. `cta` is deliberately
 * NOT part of `detail.sections` — rendered separately here, always last,
 * exactly like Speciality's Final CTA; `detail.ctaEnabled` hides it
 * entirely when the admin disabled it.
 *
 * Two elements have no `section_type` of their own (nothing to enable/
 * disable/reorder independently) and are bundled into the section whose
 * position they visually belong to, exactly matching the locked UI's
 * original fixed layout: the medical illustration is just the
 * treatment's own image shown a second time (bundled into `overview`),
 * and the inline consultation nudge has no business content to store
 * (bundled into `facts`, its original position).
 *
 * Background panels: each rendered case is wrapped in its own white
 * panel against the page's light-grey background — `hero`, `highlights`,
 * and `why_choose_us` render their own distinct backgrounds and are
 * never wrapped. This reproduces the locked UI's panel rhythm for the
 * default (as-seeded) order; an admin who reorders sections gets a
 * white panel per section rather than the original's occasional
 * multi-section merged panel — a minor, acceptable cosmetic difference
 * in exchange for the panel logic staying correct under any order.
 */
export function TreatmentDetailPage({ detail }: TreatmentDetailPageProps) {
  // The consultation form is now ONE page-level sticky sidebar (see the
  // overlay below) spanning Hero through "Choose Your City"
  // (`TreatmentRelatedCities`), not embedded inside the Hero section
  // anymore. FAQ is pulled out of its normal position within
  // `detail.sections` and rendered separately, right after that sticky
  // zone — it's the one section the sticky form must never remain stuck
  // through, and in the real seeded data `faqs` is ordered as the LAST
  // item in `detail.sections` (i.e. directly before the hardcoded
  // Related Treatments/Speciality/Cities block), so leaving it in place
  // would put it *inside* the sticky zone, directly ahead of "Choose
  // Your City" itself. Moving just this one section after the sticky
  // zone is the only way to make both "sticky spans through Choose Your
  // City" and "FAQ is never sticky" true at the same time — every other
  // section keeps its exact existing relative order untouched.
  const faqSection = detail.sections.find((section) => section.kind === "faqs");
  const stickyZoneSections = detail.sections.filter((section) => section.kind !== "faqs");

  // Hero is rendered explicitly (first) so the single form wrapper below
  // can sit immediately after it in DOM order — its natural, in-flow
  // position on mobile — while `lg:` classes turn that same wrapper into
  // an absolutely-positioned overlay on desktop. `position: absolute`
  // doesn't care about sibling order (it positions against the nearest
  // positioned ancestor, the `relative` wrapper below, regardless of
  // where in its children the overlay sits), so this placement is only
  // about getting the mobile, in-flow case right.
  const heroSection = stickyZoneSections.find((section) => section.kind === "hero");
  const afterHeroSections = stickyZoneSections.filter((section) => section.kind !== "hero");

  return (
    <div className="bg-slate-50">
      {/* ---------------- Sticky zone: Hero through "Choose Your City" ---------------- */}
      <div className="relative isolate">
        {heroSection &&<TreatmentSectionDispatcher section={heroSection} detail={detail} />}

        {/* The ONE `AppointmentLeadForm` instance for this page — never a
            second copy for mobile. Mobile (default): a plain in-flow
            block, right after the Hero, same as it always rendered
            there. `lg:` and up: the same wrapper becomes an absolute,
            `pointer-events-none` overlay stretched (`lg:inset-0`) to the
            full height of the `relative` ancestor spanning Hero through
            "Choose Your City" — `lg:bg-transparent` stops it from
            painting over every section below Hero, and
            `lg:pointer-events-auto` is restored only on the form card
            itself so the invisible overlay never blocks clicks/hovers on
            the real content underneath. The form only becomes
            `lg:sticky` at that same breakpoint; on mobile it's a normal
            block with no sticky/width constraints. `top-28` clears the
            fixed public header. No scroll listener, no `window.scrollY`
            — purely `position: sticky` within a containing block sized
            to the real content, so it stops sticking exactly when that
            content (not a guessed pixel value) ends. */}
        <div className="bg-(--color-hero-background) lg:absolute lg:inset-0 lg:z-20 lg:bg-transparent lg:pointer-events-none">
          <div className="public-container py-10 lg:flex lg:h-full lg:items-start lg:justify-end lg:py-0">
            <div
              id="treatment-appointment-form"
              className="scroll-mt-28 lg:pointer-events-auto lg:sticky lg:top-38 lg:w-90 lg:shrink-0 xl:w-100"
            >
              <AppointmentLeadForm defaultCityId={detail.cityId} defaultTreatment={`city:${detail.id}`} />
            </div>
          </div>
        </div>

        {afterHeroSections.map((section) => (
          <TreatmentSectionDispatcher key={sectionKey(section)} section={section} detail={detail} />
        ))}

        <div className="bg-white">
          <TreatmentRelatedTreatments treatments={detail.relatedTreatments} />
          <TreatmentRelatedSpeciality detail={detail} />
          <TreatmentRelatedCities treatmentName={detail.name} cities={detail.relatedCities} />
        </div>
      </div>

      {faqSection && <TreatmentSectionDispatcher section={faqSection} detail={detail} />}

      <div className="bg-white">
        <TreatmentBlogs cityName={detail.cityName} blogs={detail.blogs} />
      </div>

      {detail.ctaEnabled && <TreatmentFinalCta detail={detail} />}
    </div>
  );
}

function sectionKey(section: PublicTreatmentSectionItem): string {
  return section.kind === "custom" ? `custom-${section.id}` : section.kind;
}

function TreatmentSectionDispatcher({ section, detail }: { section: PublicTreatmentSectionItem; detail: PublicTreatmentDetail }) {
  switch (section.kind) {
    case "hero":
      return <TreatmentHero detail={detail} />;
    case "highlights":
      return <TreatmentHighlights items={detail.highlights} />;
    case "overview":
      return (
        <div className="bg-white">
          <TreatmentOverview detail={detail} />
          <TreatmentMedicalIllustration detail={detail} />
        </div>
      );
    case "facts":
      return (
        <div className="bg-white">
          <TreatmentFactsTable treatmentName={detail.name} facts={detail.facts} />
          <TreatmentInlineCta treatmentName={detail.name} contactUsHref={getContactUsUrl({ cityId: detail.cityId, treatment: `city:${detail.id}` })} />
        </div>
      );
    case "symptoms":
      return (
        <div className="bg-white">
          <TreatmentSymptoms detail={detail} />
        </div>
      );
    case "options":
      return (
        <div className="bg-white">
          <TreatmentOptions treatmentName={detail.name} options={detail.options} />
        </div>
      );
    case "eligibility":
      return (
        <div className="bg-white">
          <TreatmentEligibility treatmentName={detail.name} eligibility={detail.eligibility} />
        </div>
      );
    case "why_choose_us":
      return <TreatmentWhyChooseUs treatmentName={detail.name} whyChooseUs={detail.whyChooseUs} />;
    case "doctors":
      return (
        <div className="bg-white">
          <TreatmentDoctors treatmentName={detail.name} doctors={detail.doctors} />
        </div>
      );
    case "process":
      return (
        <div className="bg-white">
          <TreatmentProcess treatmentName={detail.name} process={detail.process} />
        </div>
      );
    case "journey":
      return (
        <div className="bg-white">
          <TreatmentJourney treatmentName={detail.name} journey={detail.journey} />
        </div>
      );
    case "hospital":
      return (
        <div className="bg-white">
          <TreatmentHospital treatmentName={detail.name} hospital={detail.hospital} />
        </div>
      );
    case "preparation_recovery":
      return (
        <div className="bg-white">
          <TreatmentPreparationRecovery groups={detail.preparationRecovery} />
        </div>
      );
    case "faqs":
      return (
        <div className="bg-white">
          <TreatmentFaq detail={detail} />
        </div>
      );
    case "custom":
      return (
        <div className="bg-white">
          <TreatmentContentBlock
            title={section.title || "Untitled section"}
            headingId={`treatment-custom-section-${section.id}`}
            html={section.contentHtml}
            imageUrl={section.imageUrl}
          />
        </div>
      );
  }
}
