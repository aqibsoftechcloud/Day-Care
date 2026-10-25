import Link from "next/link";

import { getCityUrl, getContactUsUrl, getCityTreatmentsUrl } from "@/lib/public/urls";
import type { PublicTreatmentDetail } from "@/lib/public/treatments";
import { PublicBreadcrumb } from "@/components/public/shared/PublicBreadcrumb";

type TreatmentHeroProps = {
  detail: PublicTreatmentDetail;
};

/**
 * Real data only (name/specialityName/shortDescription/city) — no demo
 * content here.
 *
 * No longer renders its own embedded `AppointmentLeadForm`/right column —
 * the consultation form is now a single, page-level sticky sidebar
 * rendered once by `TreatmentDetailPage.tsx` (spanning Hero through the
 * "Choose Your City" section, overlaid via `position: sticky`), not
 * duplicated per-section. "Book an Appointment" still anchors to it via
 * the same `#treatment-appointment-form` id, which now lives on that
 * sticky wrapper instead of inside this component.
 *
 * Breadcrumb lives in its own `public-container pt-4` div, structurally
 * separated from the content div below it — the same split
 * `GlobalHero.tsx` (the canonical breadcrumb-position reference for the
 * whole site) uses, standardizing the breadcrumb's distance from the
 * navbar across pages. The content div's `pt-8` replaces what used to be
 * a `mb-8` margin on the breadcrumb itself — same 32px gap to the
 * heading, preserved exactly; only how it's expressed changed, so this
 * page's own height/rhythm is untouched. `pb-14 sm:pb-16 lg:pb-20`
 * (the Hero's own bottom spacing) is also untouched.
 */
export function TreatmentHero({ detail }: TreatmentHeroProps) {
  return (
    <section
  aria-labelledby="treatment-hero-heading"
  className="relative min-h-[420px] w-full overflow-x-clip bg-(--color-hero-background) lg:min-h-[500px]"
>
      <div className="relative z-10 public-container pt-4">
        <PublicBreadcrumb
          tone="dark"
          items={[
            { label: "Home", href: "/" },
            { label: detail.cityName, href: getCityUrl(detail.citySeoUrl) },
            { label: "Treatments", href: getCityTreatmentsUrl(detail.citySeoUrl) },
            { label: detail.name },
          ]}
        />
      </div>

      <div className="relative z-10 public-container pb-14 pt-8 sm:pb-16 lg:pb-20">
        {/* `lg:max-w-[60%]`-equivalent: constrained to roughly the Hero's
            original left-column width (the `1.2fr` side of its old
            `1.2fr_0.95fr` grid) so the heading/description don't stretch
            edge-to-edge now that the right-column form is gone — the
            sticky form overlay (rendered by `TreatmentDetailPage.tsx`)
            visually occupies that same right-hand space instead. */}
        <div className="max-w-2xl lg:max-w-3xl">
          <span className="text-xs font-bold tracking-[0.2em] text-(--color-hero-eyebrow) uppercase">
            {detail.specialityName}
          </span>
          <h1 id="treatment-hero-heading" className="mt-3 text-3xl font-black tracking-tight text-(--color-hero-heading) sm:text-4xl lg:text-[2.75rem]">
            {detail.name}
          </h1>
          {detail.shortDescription && (
            <p className="mt-4 max-w-xl text-base text-white/70 sm:text-lg">{detail.shortDescription}</p>
          )}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={getContactUsUrl({ cityId: detail.cityId, treatment: `city:${detail.id}` })}
              className="group inline-flex items-center gap-2 rounded-lg bg-(--color-cta-primary-bg) px-5 py-3 text-sm font-semibold text-(--color-cta-primary-text) transition-colors hover:bg-(--color-cta-primary-bg)/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-hero-background)"
            >
              Book an Appointment
            </Link>
            <span className="text-sm text-white/50">{detail.cityName}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
