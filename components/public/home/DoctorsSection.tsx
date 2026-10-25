import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getHomepageDoctors } from "@/lib/public/homepage";
import { getDoctorsUrl } from "@/lib/public/urls";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import { DoctorCarousel } from "./DoctorCarousel";

type DoctorsSectionProps = {
  /** The already-resolved city id from the root resolver (`null` on the nationwide `/` homepage) — never re-derived here. */
  currentCityId: number | null;
};

/**
 * Server Component: fetches the current city's active doctors (mixed
 * nationwide when there's no city context, same convention already used
 * by Specialities/Treatments) and hands them, as a public-safe DTO, to
 * the Client Component that needs interactivity (the marquee carousel).
 * Renders nothing when there are no active doctors — never an empty
 * shell, and never a duplicated card to "fill" the carousel.
 *
 * No speciality/sort filter UI: there is no public URL/query architecture
 * for filtering doctors today (confirmed: `getDoctorsUrl()` is a bare
 * `/doctors`, no query params defined anywhere in lib/public/urls.ts),
 * and building one would mean inventing new route/query capability outside
 * this section's scope — so per the "no non-functional dropdowns" rule,
 * none is added.
 */
export async function DoctorsSection({ currentCityId }: DoctorsSectionProps) {
  const doctors = await getHomepageDoctors(currentCityId);

  if (doctors.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="doctors-heading" className="public-container py-16 sm:py-20 lg:py-24">
      <SectionHeader
        eyebrow="Our Doctors"
        title="Meet Our Specialists"
        headingId="doctors-heading"
        description="Find experienced doctors and specialists available through Day Care Surgeries."
        action={
          <Link
            href={getDoctorsUrl()}
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-(--public-primary) transition-colors hover:text-(--public-accent)"
          >
            View All Doctors
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        }
      />

      <div className="mt-10 sm:mt-12">
        <DoctorCarousel doctors={doctors} />
      </div>
    </section>
  );
}
