"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Stethoscope } from "lucide-react";
import type { PublicGlobalListingCard } from "@/lib/public/treatments";

type TreatmentCardProps = {
  treatment: PublicGlobalListingCard;
};

/**
 * A single Global Treatment card for the `/treatments` listing grid.
 * Built around `PublicGlobalListingCard` (city-independent fields only —
 * never a city-scoped treatment field), same visual shape as
 * `components/public/home/HospitalCard.tsx`. Links to `treatment.href`
 * (resolved in `lib/public/treatments.ts` — `/dcg/{specialitySeoUrl}/
 * {seoUrl}` when this treatment has an active linked global speciality,
 * `/dcg/{seoUrl}` otherwise) — never a city-prefixed treatment URL.
 *
 * `treatment.imageUrl` is the treatment's dedicated CARD ICON
 * (`global_treatments.card_icon`), never its detail-page hero image — so it
 * is shown whole (`object-contain`, padded) in a fixed-size tile rather than
 * cropped like a banner, and falls back to the default icon when unset.
 */
export function TreatmentCard({ treatment }: TreatmentCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(treatment.imageUrl) && !imageFailed;

  return (
    <Link
      href={treatment.href}
      className="group flex h-full flex-col overflow-hidden rounded-(--public-radius-card) border border-slate-200 bg-white shadow-xs transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-(--public-primary)/5">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- a global treatment's image is a managed local upload, but the plain <img> + onError fallback keeps this identical to the other listing cards it sits beside.
          <img
            src={treatment.imageUrl as string}
            alt={treatment.name}
            loading="lazy"
            className="absolute inset-6 size-[calc(100%-3rem)] object-contain transition-transform duration-500 ease-out group-hover:scale-105"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-(--public-primary)/8 to-(--public-primary)/3">
            <Stethoscope className="size-10 text-(--public-primary)/40" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <h3 className="text-base font-bold text-slate-900 sm:text-lg">{treatment.name}</h3>

        {treatment.shortDescription && (
          <p className="line-clamp-2 text-sm text-slate-500">{treatment.shortDescription}</p>
        )}

        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-(--public-primary) transition-colors group-hover:text-(--public-accent)">
          Learn More
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
