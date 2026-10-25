import Link from "next/link";
import { ArrowRight, Building2, Stethoscope } from "lucide-react";
import { getCityUrl, getHospitalsUrl } from "@/lib/public/urls";

type DoctorFinalCtaProps = {
  citySeoUrl: string;
};

/**
 * Closing section — deliberately NOT an appointment/consultation CTA
 * (no booking system exists in this product). Both buttons link to real,
 * already-working destinations only:
 *  - the city homepage's Specialities/Treatments section (the same
 *    `#specialized-care-heading` anchor `PublicFooter.tsx` already
 *    links to, since no dedicated nationwide listing page exists for
 *    either entity yet — not a new gap introduced here);
 *  - the real, working `/{city}/hospitals` listing page.
 * A third "Explore Treatments" button was considered but dropped: it
 * would point at the exact same anchor as "Explore Specialities" (both
 * live in one combined homepage section), which would be two buttons
 * pretending to be different destinations.
 */
export function DoctorFinalCta({ citySeoUrl }: DoctorFinalCtaProps) {
  return (
    <section aria-labelledby="doctor-final-cta-heading" className="bg-(--color-hero-background)">
      <div className="public-container py-8 text-center sm:py-10">
        <h2 id="doctor-final-cta-heading" className="text-xl font-black tracking-tight text-(--color-hero-heading) sm:text-2xl">
          Find the Right Care for You
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/70 sm:text-base">
          Explore our hospitals, specialities, and treatments.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`${getCityUrl(citySeoUrl)}#specialized-care-heading`}
            className="group inline-flex items-center gap-2 rounded-lg bg-(--color-cta-primary-bg) px-5 py-3 text-sm font-semibold text-(--color-cta-primary-text) transition-colors hover:bg-(--color-cta-primary-bg)/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-hero-background)"
          >
            <Stethoscope className="size-4" aria-hidden="true" />
            Explore Specialities
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <Link
            href={getHospitalsUrl(citySeoUrl)}
            className="group inline-flex items-center gap-2 rounded-lg border border-(--color-cta-secondary-border)/70 px-5 py-3 text-sm font-semibold text-(--color-cta-secondary-text) transition-colors hover:bg-white hover:text-(--color-hero-background) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-hero-background)"
          >
            <Building2 className="size-4" aria-hidden="true" />
            Find a Hospital
          </Link>
        </div>
      </div>
    </section>
  );
}
