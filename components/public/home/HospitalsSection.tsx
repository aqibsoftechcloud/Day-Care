import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { getHomepageHospitals } from "@/lib/public/homepage";
import { resolvePublicHospitalListing } from "@/lib/public/hospitals";
import { getHospitalsNationwideUrl, getHospitalsUrl } from "@/lib/public/urls";
import { HospitalCarousel } from "./HospitalCarousel";

type HospitalsSectionProps = {
  /** The already-resolved city id from the root resolver (`null` on the nationwide `/` homepage) — never re-derived here. */
  currentCityId: number | null;
  /** The already-resolved city's real name, straight from the root resolver's City row. */
  cityName: string | null;
  /** The same city row's `seo_url` — needed now that `getHospitalsUrl` is city-scoped (`/{citySeoUrl}/hospitals`). `null` exactly when `cityName` is `null`. */
  citySeoUrl: string | null;
};

/** Structural, non-quantified value points only — the `hospitals` model has no feature/accreditation/count columns to back a specific claim (NABH, 24/7, ratings counts, etc.), so none is invented here. */
const VALUE_POINTS = ["Associated Hospitals", "Specialist Facilities", "Quality Care"];

/**
 * Server Component: fetches active hospitals once and hands them, as a
 * public-safe DTO, to the Client Component that needs interactivity (the
 * carousel). City-scoped routes (`/{city}`) show that city's own
 * hospitals via the existing `getHomepageHospitals`; the nationwide `/`
 * homepage (no `cityName`/`citySeoUrl`) falls back to the first page of
 * the existing nationwide `/hospitals` listing resolver
 * (`resolvePublicHospitalListing`) rather than rendering nothing — both
 * return the same `HomepageHospital` shape, so `HospitalCarousel`/
 * `HospitalCard` need no changes either way. Renders nothing only when
 * there are genuinely zero active hospitals to show — never an empty
 * navy shell, and never a duplicated card to "fill" the carousel.
 */
export async function HospitalsSection({ currentCityId, cityName, citySeoUrl }: HospitalsSectionProps) {
  const isCityScoped = Boolean(cityName && citySeoUrl);
  const hospitals = isCityScoped
    ? await getHomepageHospitals(currentCityId)
    : (await resolvePublicHospitalListing(1)).items;

  if (hospitals.length === 0) {
    return null;
  }

  const eyebrow = isCityScoped ? `Hospitals in ${cityName}` : "Our Hospital Network";
  const exploreHref = isCityScoped ? getHospitalsUrl(citySeoUrl as string) : getHospitalsNationwideUrl();

  return (
    <section aria-labelledby="hospitals-heading" className="relative w-full overflow-x-clip bg-(--public-primary)">
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        {/* ---------------- Left content ---------------- */}
        <div className="w-full shrink-0 px-4 py-14 sm:px-6 sm:py-16 lg:w-[36%] lg:py-24 lg:pr-8 lg:pl-[max(1rem,calc((100vw-80rem)/2+2rem))] xl:pl-[max(2rem,calc((100vw-80rem)/2+2rem))]">
          <div className="flex h-full flex-col justify-center">
            <span className="text-xs font-bold tracking-[0.2em] text-(--public-accent) uppercase">{eyebrow}</span>

            <h2
              id="hospitals-heading"
              className="mt-3 text-3xl leading-tight font-black tracking-tight text-white sm:text-4xl"
            >
              Hospitals You Can
              <br />
              Count On
            </h2>

            <p className="mt-4 max-w-md text-base text-white/70">
              Explore hospitals associated with Day Care Surgeries and access care closer to you.
            </p>

            <ul className="mt-7 flex flex-col gap-3">
              {VALUE_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2.5 text-sm font-medium text-white/90">
                  <CheckCircle2 className="size-5 shrink-0 text-(--public-accent)" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link
                href={exploreHref}
                className="group inline-flex items-center gap-2 rounded-lg bg-(--public-accent) px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--public-accent)/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--public-primary)"
              >
                Explore All Hospitals
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* ---------------- Carousel ---------------- */}
        <div className="flex w-full flex-col justify-center py-8 lg:flex-1 lg:py-16">
          <HospitalCarousel hospitals={hospitals} />
        </div>
      </div>
    </section>
  );
}
