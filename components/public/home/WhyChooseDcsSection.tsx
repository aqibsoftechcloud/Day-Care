import { SectionHeader } from "@/components/public/shared/SectionHeader";
import { getCachedPublicHomepageIconComponents } from "@/lib/public/homepage-icons";
import { HomepageIconGlyph } from "./HomepageIconGlyph";

type WhyChooseDcsSectionProps = {
  /** The already-resolved city id from the root resolver (`null` on the nationwide `/` homepage) — never re-derived here. Only used to resolve each card's CMS-configurable icon; the copy below stays identical on every homepage. */
  currentCityId: number | null;
};

/**
 * Structural, non-quantified value points only — same reasoning as
 * `HospitalsSection.tsx`'s own `VALUE_POINTS`: there is no CMS source for
 * homepage-level "Why Choose Us" content (the `why_choose_us` section
 * type on Hospital/Speciality/Treatment is entity-scoped, not homepage-
 * scoped — confirmed during the Advanced Homepage Redesign audit), and
 * there is no stats/accreditation/success-rate column anywhere in this
 * schema to back a specific numeric claim. This is static interface
 * copy, not data standing in for data — no fabricated statistics, no
 * invented medical claims. Only each card's ICON is CMS-configurable
 * (see `lib/public/homepage-icons.ts`) — title/description/ordering stay
 * hardcoded exactly as before.
 */
const VALUE_PROPS = [
  {
    key: "why_verified_specialists" as const,
    title: "Verified Specialists",
    description: "Every doctor and hospital listed is reviewed and published through our own admin team, not scraped from elsewhere.",
  },
  {
    key: "why_associated_hospitals" as const,
    title: "Associated Hospitals",
    description: "Care delivered through our network of associated hospitals, close to where you live.",
  },
  {
    key: "why_transparent_process" as const,
    title: "Transparent Process",
    description: "Clear information about your speciality, treatment, and care team before you ever step in for a consultation.",
  },
  {
    key: "why_patient_first_support" as const,
    title: "Patient-First Support",
    description: "Share your details once and our team follows up to help you take the next step, at no cost to you.",
  },
];

/** Why Choose DCS — static trust/value copy (see `VALUE_PROPS`'s own doc comment for why), CMS-configurable icons only. */
export async function WhyChooseDcsSection({ currentCityId }: WhyChooseDcsSectionProps) {
  const icons = await getCachedPublicHomepageIconComponents(currentCityId);

  return (
    <section aria-labelledby="why-dcs-heading" className="public-container py-16 sm:py-20 lg:py-24">
      <SectionHeader
        eyebrow="Why Choose Us"
        title="Why Choose Day Care Surgeries"
        headingId="why-dcs-heading"
        description="A simpler way to find verified specialists and associated hospitals, built around your care."
        align="center"
      />

      <div className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
        {VALUE_PROPS.map(({ key, title, description }) => {
          const icon = icons[key];
          return (
            <div
              key={title}
              className="flex flex-col gap-4 rounded-(--public-radius-card) border border-slate-200 bg-white p-6 shadow-xs transition-shadow hover:shadow-lg"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl border border-(--color-icon-border) bg-(--color-icon-background) text-(--color-icon-foreground)">
                <HomepageIconGlyph icon={icon} className="size-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
