"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, MapPin, Star } from "lucide-react";
import type { HomepageHospital } from "@/lib/public/homepage";

type HospitalCardProps = {
  hospital: HomepageHospital;
};

/**
 * A single hospital card inside the carousel. Client Component only
 * because of the image `onError` fallback (see `SpecializedCareTabs`'s
 * `SpecializedCareCard` for the identical pattern/rationale) — everything
 * else here is static markup.
 */
export function HospitalCard({ hospital }: HospitalCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(hospital.imageUrl) && !imageFailed;

  return (
    <Link
      href={hospital.href}
      className="group flex h-full flex-col overflow-hidden rounded-(--public-radius-card) border border-slate-200 bg-white shadow-xs transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-(--public-primary)/5">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- hospital_image is an admin-entered external URL (raw URL field, not a local upload — see HospitalFormDialog), so it can be any host; next/image requires a fixed remotePatterns allowlist, which a real, unbounded set of admin-supplied hosts can't safely satisfy.
          <img
            src={hospital.imageUrl as string}
            alt={hospital.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-(--public-primary)/8 to-(--public-primary)/3">
            <Building2 className="size-10 text-(--public-primary)/40" aria-hidden="true" />
          </div>
        )}

        {hospital.googleReviews && (
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-sm">
            <Star className="size-3.5 fill-(--public-accent) text-(--public-accent)" aria-hidden="true" />
            {hospital.googleReviews}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <h3 className="text-base font-bold text-slate-900 sm:text-lg">{hospital.name}</h3>

        {hospital.address && (
          <p className="flex items-start gap-1.5 text-sm text-slate-500">
            <MapPin className="mt-0.5 size-4 shrink-0 text-(--public-primary)/60" aria-hidden="true" />
            <span className="line-clamp-2">{hospital.address}</span>
          </p>
        )}

        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-(--public-primary) transition-colors group-hover:text-(--public-accent)">
          View Hospital
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
