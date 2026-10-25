"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, HeartPulse } from "lucide-react";
import type { PublicGlobalListingCard } from "@/lib/public/treatments";

type SpecialityCardProps = {
  speciality: PublicGlobalListingCard;
};

/**
 * A single Global Speciality card for the `/specialities` listing grid —
 * mirrors `components/public/treatments/TreatmentCard.tsx` exactly (see
 * that file's own doc comment). Links to `/dcg/{seoUrl}`, never a
 * city-prefixed speciality URL.
 */
export function SpecialityCard({ speciality }: SpecialityCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(speciality.imageUrl) && !imageFailed;

  return (
    <Link
      href={speciality.href}
      className="group flex h-full flex-col overflow-hidden rounded-(--public-radius-card) border border-slate-200 bg-white shadow-xs transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-(--public-primary)/5">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- see TreatmentCard's identical note.
          <img
            src={speciality.imageUrl as string}
            alt={speciality.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-(--public-primary)/8 to-(--public-primary)/3">
            <HeartPulse className="size-10 text-(--public-primary)/40" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <h3 className="text-base font-bold text-slate-900 sm:text-lg">{speciality.name}</h3>

        {speciality.shortDescription && (
          <p className="line-clamp-2 text-sm text-slate-500">{speciality.shortDescription}</p>
        )}

        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-(--public-primary) transition-colors group-hover:text-(--public-accent)">
          Learn More
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
