"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Syringe } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import { ExpandableList } from "@/components/public/shared/ExpandableList";
import type { PublicTreatmentRelatedTreatment } from "@/lib/public/treatments";

const INITIAL_LIMIT = 3;

/** Real CMS-uploaded icon (`treatment.imageUrl`, same `speciality_logo` field the main treatment's own image uses) when set, else the generic `Syringe` fallback — same `imageFailed`/`onError` guard this codebase's other optional-image components already use, so a broken/missing URL never leaves a dead image box. Own component (not inline in the `.map()` below) so each card's load-failure state is independent. */
function RelatedTreatmentIcon({ treatment }: { treatment: PublicTreatmentRelatedTreatment }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(treatment.imageUrl) && !imageFailed;

  return (
    <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-(--public-primary)/8 to-(--public-primary)/3">
      {showImage ? (
        <Image
          src={treatment.imageUrl as string}
          alt=""
          fill
          sizes="96px"
          className="object-contain"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Syringe className="size-6 text-(--public-primary)/30" aria-hidden="true" />
      )}
    </div>
  );
}

/**
 * Real sibling treatments — same `speciality_id` + `city_id`, excluding
 * self (see `resolvePublicTreatment`). Same compact horizontal card style
 * as `SpecialityTreatments.tsx`. Renders nothing when no siblings exist.
 * Initially shows 3 — `ExpandableList` reveals the rest on demand.
 */
export function TreatmentRelatedTreatments({ treatments }: { treatments: PublicTreatmentRelatedTreatment[] }) {
  if (treatments.length === 0) return null;

  return (
    <section aria-labelledby="treatment-related-treatments-heading" className="public-container py-10 sm:py-12 lg:pr-125">
      <SectionHeader eyebrow="Related" title="Related Treatments" headingId="treatment-related-treatments-heading" />

      <div className="mt-6">
        <ExpandableList
          items={treatments.map((treatment) => (
            <Link
              key={treatment.href}
              href={treatment.href}
              className="group flex items-center gap-4 rounded-(--public-radius-card) border border-slate-200 bg-white p-3 transition-all hover:border-(--public-accent)/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
            >
              <RelatedTreatmentIcon treatment={treatment} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-base font-bold text-slate-900">{treatment.name}</h3>
                  <ArrowRight className="size-4 shrink-0 text-(--public-accent) transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
                {treatment.description && <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">{treatment.description}</p>}
              </div>
            </Link>
          ))}
          initialLimit={INITIAL_LIMIT}
          itemsClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          moreLabel="View More Treatments"
        />
      </div>
    </section>
  );
}
