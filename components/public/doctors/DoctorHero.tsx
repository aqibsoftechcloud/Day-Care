import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Briefcase, MapPin, Star, UserRound } from "lucide-react";
import { getCityUrl, getDoctorsUrl } from "@/lib/public/urls";
import type { PublicDoctorDetail } from "@/lib/public/doctors";
import { PublicBreadcrumb } from "@/components/public/shared/PublicBreadcrumb";

type DoctorHeroProps = {
  detail: PublicDoctorDetail;
  /** The stat cards (`DoctorHighlights embedded`), rendered under the CTA so they use the column's width and read as part of the profile. */
  highlights?: ReactNode;
};

/**
 * Doctor Profile Hero — deliberately NOT a form-beside-image layout like
 * Hospital/Treatment/Speciality's own Hero sections. There is no
 * appointment-management system in this product, so the right column
 * that would normally hold `AppointmentLeadForm` instead holds the
 * doctor's own information at full visual weight: name, taxonomy
 * badges, qualification/experience line, city, and — only when the real
 * `doctor_hospitals` relationship actually has one — a single "View
 * Hospital" link to the first associated hospital. No booking action of
 * any kind is rendered here.
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
export function DoctorHero({ detail, highlights }: DoctorHeroProps) {
  const primaryHospital = detail.hospitals[0] ?? null;

  return (
    <section aria-labelledby="doctor-hero-heading" className="w-full border-b border-slate-200 bg-slate-50">
      <div className="relative z-10 public-container pt-4">
        <PublicBreadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: detail.cityName, href: getCityUrl(detail.citySeoUrl) },
            { label: "Doctors", href: getDoctorsUrl() },
            { label: detail.name },
          ]}
        />
      </div>

      <div className="relative z-10 public-container pb-6 pt-3 sm:pb-8">
        {/* Compact two-column profile: a fixed-size portrait (about 280x320 on desktop) beside the details, vertically centred with
            each other. Stacks on mobile with a smaller, centred portrait. No min-heights, so the section is exactly as tall as its content. */}
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
          <div className="relative h-52 w-44 shrink-0 overflow-hidden rounded-(--public-radius-card) bg-gradient-to-br from-(--public-primary)/8 to-(--public-primary)/3 shadow-xs sm:h-64 sm:w-56 lg:h-80 lg:w-70">
            {detail.imageUrl ? (
              <Image
                src={detail.imageUrl}
                alt={detail.name}
                fill
                priority
                sizes="(min-width: 1024px) 280px, (min-width: 640px) 224px, 176px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <UserRound className="size-20 text-(--public-primary)/30" aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="flex w-full min-w-0 flex-col items-center text-center sm:flex-1 sm:items-start sm:text-left">
            <h1 id="doctor-hero-heading" className="text-2xl font-black tracking-tight text-(--public-primary) sm:text-3xl lg:text-4xl">
              {detail.name}
            </h1>

            {detail.specialities.length > 0 && (
              <div className="mt-2.5 flex flex-wrap justify-center gap-2 sm:justify-start">
                {detail.specialities.map((speciality) => (
                  <span
                    key={speciality.id}
                    className="rounded-full bg-(--public-primary)/8 px-2.5 py-1 text-xs font-semibold text-(--public-primary)"
                  >
                    {speciality.name}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600 sm:text-base">
              {detail.qualification && <p className="font-medium text-slate-800">{detail.qualification}</p>}
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 sm:justify-start">
                {detail.experience && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="size-4 text-(--public-primary)/50" aria-hidden="true" />
                    {detail.experience}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-(--public-primary)/50" aria-hidden="true" />
                  {detail.cityName}
                </span>
                {detail.satisfactionScore && (
                  <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Star className="size-4 fill-(--public-accent) text-(--public-accent)" aria-hidden="true" />
                    {detail.satisfactionScore}
                  </span>
                )}
              </div>
            </div>

            {primaryHospital && (
              <Link
                href={primaryHospital.href}
                className="group mt-4 inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-(--color-cta-primary-bg) px-5 py-2.5 text-sm font-semibold text-(--color-cta-primary-text) transition-colors hover:bg-(--color-cta-primary-bg)/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-cta-primary-bg) focus-visible:ring-offset-2"
              >
                View Hospital
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            )}

            {highlights}
          </div>
        </div>
      </div>
    </section>
  );
}
