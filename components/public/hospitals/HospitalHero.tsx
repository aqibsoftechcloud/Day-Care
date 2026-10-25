import { Building2, Clock, MapPin, Navigation, Phone, Star } from "lucide-react";
import { getCityUrl, getHospitalsUrl } from "@/lib/public/urls";
import type { PublicHospitalDetail } from "@/lib/public/hospitals";
import { AppointmentLeadForm } from "@/components/public/home/AppointmentLeadForm";
import { PublicBreadcrumb } from "@/components/public/shared/PublicBreadcrumb";

type HospitalHeroProps = {
  detail: PublicHospitalDetail;
};

/** A usable, absolute http(s) link — guards `location_map` (free-text, unvalidated at write time) before it's used as an href, rather than trusting it blindly. */
function isUsableHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Breadcrumb + hospital profile card + appointment form. Deliberately a
 * light/white composition, not the navy banner Speciality/Treatment Hero
 * sections use — the reference hospital page uses a compact white header
 * (image + identity card) rather than a full-bleed colored hero, and that
 * is a genuinely different, intentional composition here, not a departure
 * from the design system (the same navy/orange tokens, container, and
 * radius are still used throughout).
 *
 * 100% real data — `PublicHospitalDetail`, resolved in
 * lib/public/hospitals.ts. The rating row and address each render only
 * when the hospital's own real `google_reviews`/`address` field is set —
 * no "reviewCount" badge: `hospitals` has no review-count column for any
 * hospital, so it was never added, as a fabricated value (see the CMS
 * integration task's own "no hardcoded fallbacks" rule). `timings` (e.g.
 * "24x7") IS a real column and is rendered as its own badge next to the
 * rating, only when set for this hospital.
 *
 * "Hospitals" in the breadcrumb is plain text, not a link — there is no
 * nationwide `/hospitals` listing page built yet, same "don't link to a
 * 404" precedent as SpecialityHero's own breadcrumb.
 *
 * `location_360_view` is resolved onto `PublicHospitalDetail` (see
 * lib/public/hospitals.ts) but intentionally NOT rendered here — this
 * page has no existing 360°-view UI slot, and inventing one is explicitly
 * out of scope for this pass (a separate visual-refinement task owns
 * that). The field is simply available for whichever future UI consumes
 * it.
 *
 * Breadcrumb lives in its own `public-container pt-4` div, structurally
 * separated from the content div below it — the same split
 * `GlobalHero.tsx` (the canonical breadcrumb-position reference for the
 * whole site) uses, standardizing the breadcrumb's distance from the
 * navbar across pages. The content div's `pt-4` replaces what used to be
 * a `mt-4` margin on the content grid itself — same 16px gap, preserved
 * exactly. `pb-4 sm:pb-5` (this Hero's own bottom spacing, from the old
 * shared `py-4 sm:py-5`) is also untouched.
 */
export function HospitalHero({ detail }: HospitalHeroProps) {
  // "Get Directions" prefers the admin-configured `location_map` link
  // (precise — a specific pin/place the admin picked) and only falls
  // back to an address-text search when there's no usable stored map
  // link, never the other way around. Each hospital resolves this
  // independently from its own `detail.locationMap`/`detail.address` —
  // no cross-hospital fallback, no hardcoded URL.
  const directionsHref =
    detail.locationMap && isUsableHttpUrl(detail.locationMap)
      ? detail.locationMap
      : detail.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detail.address)}`
        : null;

  return (
    <section aria-labelledby="hospital-hero-heading" className="w-full border-b border-slate-200 bg-slate-50">
      <div className="relative z-10 public-container pt-4">
        <PublicBreadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: detail.cityName, href: getCityUrl(detail.citySeoUrl) },
            { label: "Hospitals", href: getHospitalsUrl(detail.citySeoUrl) },
            { label: detail.name },
          ]}
        />
      </div>

      <div className="relative z-10 public-container pb-4 pt-4 sm:pb-5">
        {/* Two balanced columns on desktop: the hospital card takes the remaining width and stretches to the form's height
            (its image fills the spare space), so neither side floats in empty space. Stacked on mobile: hospital first, then the form. */}
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-8">
          <div className="flex flex-col overflow-hidden rounded-(--public-radius-card) border border-slate-200 bg-white shadow-xs">
            <div className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-(--public-primary)/8 to-(--public-primary)/3 sm:aspect-[21/9] lg:aspect-auto lg:min-h-56 lg:flex-1">
              <Building2 className="size-14 text-(--public-primary)/30" aria-hidden="true" />
              {detail.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- hospital_image is an admin-entered external URL (raw URL field, not a local upload — see HospitalFormDialog), so it can be any host; next/image requires a fixed remotePatterns allowlist, which a real, unbounded set of admin-supplied hosts can't safely satisfy. Same documented reasoning as HospitalCard.tsx's identical treatment of this exact field. Sits over the building-icon placeholder, so a broken image still looks designed.
                <img src={detail.imageUrl} alt={detail.name} className="absolute inset-0 size-full object-cover" />
              )}
            </div>

            <div className="min-w-0 p-5 sm:p-6">
              <h1 id="hospital-hero-heading" className="text-2xl font-black tracking-tight text-(--public-primary) sm:text-3xl">
                {detail.name}
              </h1>

              {(detail.googleReviews || detail.timings) && (
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600">
                  {detail.googleReviews && (
                    <span className="flex items-center gap-1 font-semibold text-slate-800">
                      <Star className="size-4 fill-(--public-accent) text-(--public-accent)" aria-hidden="true" />
                      {detail.googleReviews}
                    </span>
                  )}
                  {detail.timings && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-4 text-(--public-primary)/50" aria-hidden="true" />
                      {detail.timings}
                    </span>
                  )}
                </div>
              )}

              {detail.address && (
                <p className="mt-3 flex items-start gap-1.5 text-sm text-slate-600">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-(--public-primary)/50" aria-hidden="true" />
                  {detail.address}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {directionsHref && (
                  <a
                    href={directionsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-(--public-primary) transition-colors hover:border-(--public-accent)/40 hover:text-(--public-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
                  >
                    <Navigation className="size-4" aria-hidden="true" />
                    Get Directions
                  </a>
                )}
                {detail.phoneNumber && (
                  <a
                    href={`tel:${detail.phoneNumber}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-(--color-cta-primary-bg) px-4 py-2.5 text-sm font-semibold text-(--color-cta-primary-text) transition-colors hover:bg-(--color-cta-primary-bg)/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-cta-primary-bg) focus-visible:ring-offset-2"
                  >
                    <Phone className="size-4" aria-hidden="true" />
                    Call Hospital
                  </a>
                )}
              </div>
            </div>
          </div>

          <div id="hospital-appointment-form" className="mx-auto w-full max-w-md scroll-mt-28 lg:mx-0 lg:max-w-none">
            <AppointmentLeadForm />
          </div>
        </div>
      </div>
    </section>
  );
}
