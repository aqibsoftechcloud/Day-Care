import type { PublicGlobalContentDetail } from "@/lib/public/global-content";
import { GlobalHero } from "./GlobalHero";
import { GlobalContent } from "./GlobalContent";
import { GlobalRelatedTreatments } from "./GlobalRelatedTreatments";
import { GlobalChooseYourCity } from "./GlobalChooseYourCity";
import { GlobalFaqs } from "./GlobalFaqs";
import { GlobalBlogs } from "./GlobalBlogs";
import { GlobalFinalCta } from "./GlobalFinalCta";
import { AppointmentLeadForm } from "@/components/public/home/AppointmentLeadForm";

type GlobalDetailPageProps = {
  detail: PublicGlobalContentDetail;
};

/**
 * `/dcg/{seoUrl}` page template — 100% driven by `PublicGlobalContentDetail`
 * (lib/public/global-content.ts), which itself reads ONLY
 * `global_treatments`/`global_specialities` and their own section/FAQ/
 * (nationwide, unfiltered) blog data. No city row is ever used as this
 * page's content source — the only city-aware piece is
 * `GlobalChooseYourCity`, which links OUT to the real city pages rather
 * than embedding their content.
 *
 * Section order follows the same overall landing-page rhythm the city
 * Speciality/Treatment Detail pages use (Hero → main content → Related
 * Treatments (speciality only) → Choose Your City/"availability" → FAQ →
 * related reading → Final CTA). `GlobalRelatedTreatments` is the one
 * exception to the "no cross-entity section" rule below: `global_treatments`
 * now carries an explicit, admin-set, nullable `global_speciality_id`
 * (see that column's own schema doc comment and
 * `lib/public/global-content.ts`'s `resolvePublicGlobalContent`) — a
 * real global-to-global relationship, not derived through any city row —
 * so it renders only the treatments actually linked to THIS speciality,
 * and nothing when none are. Several other city-only sections are still
 * deliberately NOT present, each because no legitimate global data
 * source exists for it — reported as omitted rather than faked with
 * invented structure or city data:
 *  - Treatment-only structured sections (Highlights strip, Facts table,
 *    Symptoms chips, Options cards, Eligibility block, a structured
 *    Why-Choose-Us icon grid, Process steps, Journey timeline, a single
 *    linked Hospital, Preparation/Recovery columns, per-doctor cards):
 *    every one of these reads from its own dedicated `treatment_sections`
 *    `section_type` with its own structured JSON shape (or a real city FK
 *    like `treatments.hospital_id`). `global_treatment_sections` (and
 *    `global_speciality_sections`) is a single flat `title`/`content`/
 *    `image` row type with no such structure at all — so none of these
 *    can be reproduced globally without either fabricating structure the
 *    CMS was never given, or silently reading a city row. `GlobalContent`
 *    renders the real flat CMS sections as clean editorial blocks instead.
 *  - Patient reviews / video testimonials: `testimonials` is a city-scoped
 *    table (required `city_id`) with no nationwide concept at all — the
 *    city pages' own "no city testimonials yet" fallback is itself
 *    city-wide, not nationwide, so there is no legitimate global source to
 *    reuse without presenting one city's patients as if they spoke for
 *    the whole country.
 *
 * Renders fully even when `cities`/`blogs` are empty (a brand-new global
 * entity with nothing linked/no blogs yet) — each optional section
 * simply renders nothing, same "render nothing, never a fabricated
 * fallback" convention every other optional section on this site follows.
 *
 * `bg-slate-50` page base, matching `TreatmentDetailPage.tsx`/
 * `SpecialityDetailPage.tsx`'s own base exactly: Hero/Final CTA set their
 * own dark `bg-(--public-primary)` (overriding the base), `GlobalContent`/
 * `GlobalFaqs`/`GlobalBlogs` are each their own explicit `bg-white` panel,
 * and `GlobalChooseYourCity` deliberately has none — it shows the grey
 * base through, the same "white panel on a grey page" rhythm the city
 * pages use between their own differently-typed sections.
 *
 * The main consultation form is now a single, page-level sticky sidebar
 * spanning `GlobalHero` + `GlobalContent` only — the exact same
 * `relative` -> `absolute lg:inset-0` -> `lg:flex lg:justify-end` ->
 * `lg:sticky lg:top-28` overlay pattern already live-verified on
 * `TreatmentDetailPage.tsx`, adapted here (no CMS section-order/FAQ
 * extraction logic applies to this fixed, hardcoded section list). The
 * `relative` wrapper ends immediately after `GlobalContent`, so the
 * sticky zone — and its containing block — never extends into
 * `GlobalChooseYourCity`, which (along with FAQs/Blogs/Final CTA) stays
 * a plain sibling outside it, untouched. `GlobalFinalCta` keeps its own,
 * separate `AppointmentLeadForm` instance exactly as before — two
 * legitimate, independent conversion points on this page, same
 * Hero + Final CTA convention the city Treatment/Speciality pages use.
 */
export function GlobalDetailPage({ detail }: GlobalDetailPageProps) {
  return (
    <div className="bg-slate-50">
      {/* `isolate` + the overlay's `lg:z-20` lift the form above the Hero's `relative z-10` content containers (which span the full width and otherwise swallow every click) without escaping this section above the z-40 header. */}
      <div className="relative isolate">
        <GlobalHero detail={detail} />

        <div className="bg-(--color-hero-background) lg:absolute lg:inset-0 lg:z-20 lg:bg-transparent lg:pointer-events-none">
          <div className="public-container py-10 lg:flex lg:h-full lg:items-start lg:justify-end lg:py-0">
  <div
  id="global-appointment-form"
  className="scroll-mt-28 lg:pointer-events-auto lg:sticky lg:top-[120px] lg:w-90 lg:shrink-0 xl:w-100"
>
  <AppointmentLeadForm defaultTreatment={detail.kind === "treatment" ? `global:${detail.id}` : null} />
</div>
          </div>
        </div>

        <GlobalContent detail={detail} />
      </div>

      <GlobalRelatedTreatments treatments={detail.relatedTreatments} />
      <GlobalChooseYourCity cities={detail.cities} />
      <GlobalFaqs faqs={detail.faqs} />
      <GlobalBlogs blogs={detail.blogs} />
      <GlobalFinalCta detail={detail} />
    </div>
  );
}
