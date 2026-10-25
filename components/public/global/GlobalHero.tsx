"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { MapPinned } from "lucide-react";
import { getContactUsUrl, getSpecialitiesUrl, getTreatmentsUrl } from "@/lib/public/urls";
import type { PublicGlobalContentDetail } from "@/lib/public/global-content";
import { PublicBreadcrumb } from "@/components/public/shared/PublicBreadcrumb";

type GlobalHeroProps = {
  detail: PublicGlobalContentDetail;
};

/**
 * Dark navy hero matching `SpecialityHero.tsx`/`TreatmentHero.tsx`'s exact
 * structure (breadcrumb, eyebrow, H1, short description, appointment CTA)
 * — but city-independent throughout:
 *
 * - "Home" links to `/`, never a city root (there is no city here).
 * - No "Call Hospital" button — that reads `detail.hospital.phoneNumber`
 *   on the city pages, a concept this city-independent page has none of.
 * - The "Available Across Multiple Cities" badge only renders when
 *   `detail.cities` (the real, FK-driven city-link list resolved in
 *   lib/public/global-content.ts) is non-empty — never shown as a
 *   generic claim when nothing is actually linked yet.
 *
 * No longer renders its own embedded `AppointmentLeadForm` — matching
 * `TreatmentHero.tsx`'s own precedent, the consultation form is now a
 * single, page-level sticky sidebar rendered once by
 * `GlobalDetailPage.tsx` (spanning Hero through `GlobalContent`, overlaid
 * via `position: sticky`), not duplicated per-section. "Book an
 * Appointment" still anchors to it via the same `#global-appointment-form`
 * id, which now lives on that sticky wrapper instead of inside this
 * component. `max-w-2xl lg:max-w-3xl` keeps the heading/description from
 * stretching edge-to-edge now that the right-column form is gone — the
 * sticky overlay visually occupies that same right-hand space instead.
 *
 * `lg:` spacing overrides (container `py`, and the `mt-*` gaps between
 * breadcrumb/badge/H1/description/CTA) tighten the vertical rhythm at
 * desktop only — mobile/tablet keep their original values untouched. The
 * section's own height was already tightly wrapped to its content (no
 * hidden empty block at the bottom), so the "too tall" feel came from the
 * cumulative generosity of these internal gaps, not from unused padding.
 *
 * `detail.imageUrl` — the same existing CMS image field `GlobalContent.tsx`
 * used to render (reused here, not duplicated; `GlobalContent.tsx` no
 * longer renders it) — now fills the ENTIRE section as a full-bleed
 * background (`fill` + `object-cover`), not a separate card/column. A
 * `bg-gradient-to-r` overlay (navy from the left, fading out toward the
 * right) sits between the image and the content so breadcrumb/H1/
 * description stay readable against any photo while the image itself
 * stays visibly uncovered further right, behind the consultation form's
 * own opaque white card. The section's own `bg-(--color-hero-background)`
 * is the fallback when there's no image (or it fails to load, via the
 * same `imageFailed`/`onError` guard `GlobalContent.tsx` used) — in that
 * case neither the `Image` nor the overlay render, and the Hero looks
 * exactly as it did before this change. No grid/column layout is used
 * for the image anymore, so there's nothing for the sticky form overlay
 * to collide with — the Hero content column keeps its original
 * `max-w-2xl lg:max-w-3xl` cap unconditionally.
 */
export function GlobalHero({ detail }: GlobalHeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const kindLabel = detail.kind === "treatment" ? "Treatment" : "Speciality";
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(detail.imageUrl) && !imageFailed;

  const fadeUp = prefersReducedMotion ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } };

 return (
  <section
    aria-labelledby="global-hero-heading"
    className="relative w-full overflow-hidden bg-(--color-hero-background)"
  >
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

    {/* Breadcrumb */}
    <div className="relative z-10 public-container pt-4">
      <PublicBreadcrumb
        tone="dark"
        items={[
          { label: "Home", href: "/" },
          detail.kind === "speciality"
            ? { label: "Specialities", href: getSpecialitiesUrl() }
            : { label: "Treatments", href: getTreatmentsUrl() },
          { label: detail.name },
        ]}
      />
    </div>

    {/* Main Hero Content */}
    <div className="relative z-10 public-container pb-16 pt-8 sm:pb-20 sm:pt-10 lg:pb-20 lg:pt-20">
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-2xl lg:max-w-3xl"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold tracking-[0.2em] text-(--color-hero-eyebrow) uppercase">
            {kindLabel}
          </span>

          {detail.cities.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide text-white/80 uppercase">
              <MapPinned
                className="size-3.5 text-(--color-hero-eyebrow)"
                aria-hidden="true"
              />
              Available Across Multiple Cities
            </span>
          )}
        </div>

        <h1
          id="global-hero-heading"
          className="mt-3 text-3xl font-black tracking-tight text-(--color-hero-heading) sm:text-4xl lg:mt-2 lg:text-5xl"
        >
          {detail.name}
        </h1>

        {detail.shortDescription && (
          <p className="mt-3 max-w-xl text-base text-white/70 sm:text-lg lg:mt-3">
            {detail.shortDescription}
          </p>
        )}

        <div className="mt-7 flex flex-wrap items-center gap-3 lg:mt-5">
          <Link
            href={getContactUsUrl({ treatment: detail.kind === "treatment" ? `global:${detail.id}` : null })}
            className="group inline-flex items-center gap-2 rounded-lg bg-(--color-cta-primary-bg) px-5 py-3 text-sm font-semibold text-(--color-cta-primary-text) transition-colors hover:bg-(--color-cta-primary-bg)/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-hero-background)"
          >
            Book an Appointment
          </Link>
        </div>
      </motion.div>
    </div>
  </section>
);
}
