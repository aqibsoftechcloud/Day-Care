"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { MapPin, UserRound } from "lucide-react";
import { AppointmentLeadForm } from "./AppointmentLeadForm";
import { getDoctorsUrl, getContactUsUrl } from "@/lib/public/urls";

export type HeroBannerData = {
  id: number;
  name: string;
  url: string | null;
  desktopImage: string;
  mobileImage: string | null;
};

interface HeroBannerViewProps {
  banner: HeroBannerData | null;
  cityName?: string | null;
  /**
   * Whether the navbar floats `fixed` and transparent over this Hero (the
   * city-page default, unchanged) vs. renders as a normal solid `sticky`
   * bar above it (the homepage, as of the navbar-transparency fix). Only
   * changes this Hero's own top padding — see the comment on the content
   * grid below — never the image, content, or any other styling.
   */
  transparentOverHero?: boolean;
}

/**
 * One cohesive first-view composition: a full-bleed CMS banner image as
 * the Hero's background, with the content grid (text + consultation
 * card) sitting directly on top of it — not a separate image block
 * followed by a form card overlapping below. `min-h-*` controls the
 * Hero's total height directly (per the Advanced Homepage Redesign's
 * 600–720px desktop / ~560–680px mobile target) rather than deriving it
 * from stacking two differently-sized blocks.
 *
 * Image treatment: the one active CMS banner image today
 * (`/uploads/banners/9d6cdca9-...jpg`) is a near-square photograph, so
 * stretching it across a very wide, short banner crops aggressively no
 * matter what — `object-position` is biased toward the upper portion
 * (`object-[center_28%]`) to keep the subject's face/upper body in
 * frame rather than centering on their hands, and the overlay below is
 * deliberately much lighter than before so the actual photograph still
 * reads as a photograph instead of a near-black wash. Per the redesign
 * brief, the image itself is never swapped/invented here — only its
 * CSS framing and the overlay opacity changed.
 *
 * The root `<section>` itself carries `data-hero-sentinel` —
 * `HeaderVisibilityProvider` observes its real `intersectionRatio`
 * (not a thin 1px marker) to derive the navbar's three states
 * (transparent/glass/solid), so the Hero's own full height and position
 * are the single source of truth for when each state applies.
 */
export function HeroBannerView({ banner, cityName, transparentOverHero = true }: HeroBannerViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const hasImage = Boolean(banner?.desktopImage);

  const heading = banner?.name || (cityName ? `Day Care Surgeries in ${cityName}` : "Day Care Surgeries");
  const eyebrow = cityName ?? "Available Across Multiple Cities";

  const fadeUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <section
      aria-labelledby="hero-heading"
      data-hero-sentinel="true"
      className="relative w-full overflow-x-clip bg-(--color-hero-background)"
    >
      {/* ---------------- Full-bleed background image + overlay ---------------- */}
      <div className="absolute inset-0 overflow-hidden">
        {hasImage && banner && (
          <>
            {/* Desktop / tablet crop */}
            <Image
              src={banner.desktopImage}
              alt={banner.name}
              fill
              priority
              sizes="100vw"
              className="hidden object-cover object-[center_28%] sm:block"
            />
            {/* Mobile crop — falls back to the same desktop image when no dedicated mobile crop is set in the CMS */}
            <Image
              src={banner.mobileImage || banner.desktopImage}
              alt={banner.name}
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_28%] sm:hidden"
            />
          </>
        )}

        {/* Directional gradient only — stronger on the left (where the text
            sits) fading to a light touch on the right, never a uniform dark
            wash. Noticeably lighter than the previous treatment so the
            photograph itself stays visible rather than reading as a flat
            navy filter. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-(--color-hero-background)/75 via-(--color-hero-background)/40 to-(--color-hero-background)/10"
        />
      </div>

      {/* ---------------- Foreground content grid ---------------- */}
      {/* When the navbar floats `fixed` and transparent over this Hero
          (`transparentOverHero`, true on city pages), top padding clears
          the COMPLETE navbar overlay, which is always present (both
          navigation rows, never collapsing) — `pt-24` clears just the
          single Brand Bar row (the only row shown below the `lg`
          breakpoint, where Row 2's desktop bar is `hidden`), `lg:pt-32`
          clears both rows once Row 2 is actually visible. When the navbar
          is solid/`sticky` instead (the homepage), it already reserves
          its own height in normal flow, so this padding would double up
          with it — the same symmetric `pt-12`/`lg:pt-16` as the section's
          own `pb-12`/`lg:pb-16` is used instead. */}
      <div
        className={`public-container relative z-10 flex min-h-[560px] items-center pb-12 sm:min-h-[600px] md:min-h-[640px] lg:min-h-[660px] lg:pb-16 xl:min-h-[720px] ${transparentOverHero ? "pt-24 lg:pt-32" : "pt-12 lg:pt-16"}`}
      >
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-8 lg:pt-4">
          {/* ---------------- Left: eyebrow / heading / description / CTA ---------------- */}
          <motion.div {...fadeUp} transition={{ duration: 0.5, ease: "easeOut" }}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <MapPin className="size-3.5 text-(--color-hero-eyebrow)" aria-hidden="true" />
              {eyebrow}
            </span>

            <h1
              id="hero-heading"
              className="mt-5 max-w-xl text-[2.25rem] leading-[1.1] font-black tracking-tight text-balance text-(--color-hero-heading) sm:text-5xl lg:text-[3.25rem]"
            >
              {heading}
            </h1>

            <p className="mt-5 max-w-md text-base text-white/85 sm:text-lg">
              Book a free consultation and our care team will call you back to confirm your appointment.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={getContactUsUrl()}
                className="inline-flex items-center justify-center rounded-lg bg-(--color-cta-primary-bg) px-6 py-3 text-sm font-semibold text-(--color-cta-primary-text) transition-colors hover:bg-(--color-cta-primary-bg)/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-hero-background)"
              >
                Book FREE Consultation
              </Link>
              <Link
                href={getDoctorsUrl()}
                className="inline-flex items-center gap-2 rounded-lg border border-(--color-cta-secondary-border)/70 px-6 py-3 text-sm font-semibold text-(--color-cta-secondary-text) transition-colors hover:bg-white hover:text-(--color-hero-background) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-hero-background)"
              >
                <UserRound className="size-4" aria-hidden="true" />
                Find a Doctor
              </Link>
            </div>
          </motion.div>

          {/* ---------------- Right: consultation card ---------------- */}
          <motion.div
            id="hero-consultation-form"
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
            className="scroll-mt-28 lg:justify-self-end"
          >
            <div className="mx-auto w-full max-w-md lg:mx-0 lg:w-90 xl:w-100">
              <AppointmentLeadForm />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
