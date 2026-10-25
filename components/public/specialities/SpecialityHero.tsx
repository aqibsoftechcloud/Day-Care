"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

import { getCityUrl, getContactUsUrl, getCitySpecialitiesUrl } from "@/lib/public/urls";
import type { PublicSpecialityDetail } from "@/lib/public/specialities";
import { AppointmentLeadForm } from "@/components/public/home/AppointmentLeadForm";
import { PublicBreadcrumb } from "@/components/public/shared/PublicBreadcrumb";

type SpecialityHeroProps = {
  detail: PublicSpecialityDetail;
};

/**
 * Breadcrumb + hero + the real appointment form, all in one section.
 * "Specialities" in the breadcrumb is plain text, not a link —
 * `/specialities` has no page built yet (same pre-existing gap already
 * flagged on the homepage sections), and a breadcrumb crumb pointing at a
 * 404 would be worse than one that just isn't clickable. "Home" links to
 * this speciality's own city home (`/{citySeoUrl}`), not the nationwide
 * `/`, since everything on this page is already inside that city's
 * context.
 *
 * `detail.imageUrl` (the speciality's own `speciality_logo` hero upload —
 * never `card_icon`, which is only for listing cards) fills the whole
 * section as a full-bleed background, with a left-to-right navy gradient
 * keeping the text readable, exactly like `GlobalHero.tsx`. With no image
 * (or one that fails to load) neither the image nor the gradient render
 * and the hero looks as it always did.
 *
 * The right column is the real
 * `AppointmentLeadForm` itself (not a second, different form; the "Book
 * an Appointment" button is just an in-page anchor down to this exact
 * instance, for the case where the form has scrolled out of view on
 * mobile). This is the page's primary, above-the-fold conversion point;
 * the Final CTA further down the page renders its own separate instance
 * of the same component as a second, later conversion point — both are
 * genuinely the same reusable form, not duplicated logic.
 *
 * Breadcrumb lives in its own `public-container pt-4` div, structurally
 * separated from the content div below it — the same split
 * `GlobalHero.tsx` (the canonical breadcrumb-position reference for the
 * whole site) uses, standardizing the breadcrumb's distance from the
 * navbar across pages. The content div's `pt-4` replaces what used to be
 * a `mt-4` margin on the content grid itself — same 16px gap to the
 * heading, preserved exactly. `pb-3 sm:pb-4 lg:pb-5` (the Hero's own
 * bottom spacing, from the old shared `py-3 sm:py-4 lg:py-5`) is also
 * untouched.
 */
export function SpecialityHero({ detail }: SpecialityHeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(detail.imageUrl) && !imageFailed;

  const fadeUp = prefersReducedMotion
    ? {}
    : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } };

  return (
    <section aria-labelledby="speciality-hero-heading" className="relative w-full overflow-x-clip bg-(--color-hero-background)">
      {showImage && (
        <>
          <Image
            src={detail.imageUrl as string}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            onError={() => setImageFailed(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-(--color-hero-background) via-(--color-hero-background)/85 to-(--color-hero-background)/40" />
        </>
      )}

      <div className="relative z-10 public-container pt-4">
        <PublicBreadcrumb
          tone="dark"
          items={[
            { label: "Home", href: "/" },
            { label: detail.cityName, href: getCityUrl(detail.citySeoUrl) },
            { label: "Specialities", href: getCitySpecialitiesUrl(detail.citySeoUrl) },
            { label: detail.name },
          ]}
        />
      </div>

      <div className="relative z-10 public-container pb-3 pt-4 sm:pb-4 lg:pb-5">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div>
            <span className="text-xs font-bold tracking-[0.2em] text-(--color-hero-eyebrow) uppercase">{detail.name}</span>
            <h1 id="speciality-hero-heading" className="mt-3 text-3xl font-black tracking-tight text-(--color-hero-heading) sm:text-4xl lg:text-5xl">
              {detail.name}
            </h1>
            {detail.shortDescription && (
              <p className="mt-4 max-w-xl text-base text-white/70 sm:text-lg">{detail.shortDescription}</p>
            )}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={getContactUsUrl({ cityId: detail.cityId })}
                className="group inline-flex items-center gap-2 rounded-lg bg-(--color-cta-primary-bg) px-5 py-3 text-sm font-semibold text-(--color-cta-primary-text) transition-colors hover:bg-(--color-cta-primary-bg)/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-hero-background)"
              >
                Book an Appointment
              </Link>
              {/* Real hospital phone number only (specialities.hospital_id -> hospitals.phone_number) — never a fabricated or generic site-wide number. */}
              {detail.hospital?.phoneNumber && (
                <a
                  href={`tel:${detail.hospital.phoneNumber}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-(--color-cta-secondary-border)/20 px-5 py-3 text-sm font-semibold text-(--color-cta-secondary-text) transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-hero-background)"
                >
                  Call {detail.hospital.phoneNumber}
                </a>
              )}
            </div>
          </div>

          <div
  id="speciality-appointment-form"
  className="w-full max-w-md scroll-mt-24 lg:justify-self-end"
>
            <AppointmentLeadForm />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
