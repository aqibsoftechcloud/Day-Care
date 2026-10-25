"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Star, UserRound } from "lucide-react";
import type { HomepageDoctor } from "@/lib/public/homepage";

type DoctorCardProps = {
  doctor: HomepageDoctor;
};

/**
 * A single doctor card inside the marquee carousel. Client Component
 * only because of the image `onError` fallback (same pattern as
 * HospitalCard/SpecializedCareTabs's card) — everything else is static.
 */
export function DoctorCard({ doctor }: DoctorCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(doctor.imageUrl) && !imageFailed;

  return (
    <Link
      href={doctor.href}
      className="group flex h-full flex-col overflow-hidden rounded-(--public-radius-card) border border-slate-200 bg-white shadow-xs transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
    >
      {/*
        Fixed 4:3 image area, identical for every doctor regardless of the
        uploaded photo's own dimensions: the container's height is derived
        purely from `aspect-[4/3]` on its own 100%-width box (never from the
        image), `overflow-hidden` + `object-cover` crop to fill it without
        distortion, and `object-center` keeps portrait photos centered
        (verified against real uploads: doesn't cut off faces) rather than
        relying on the browser's own object-position default.
      */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-(--public-primary)/5">
        {showImage ? (
          <Image
            src={doctor.imageUrl as string}
            alt={doctor.name}
            fill
            sizes="(min-width: 1280px) 26vw, (min-width: 1024px) 31vw, 84vw"
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-(--public-primary)/8 to-(--public-primary)/3">
            <UserRound className="size-12 text-(--public-primary)/40" aria-hidden="true" />
          </div>
        )}

        {doctor.specialityName && (
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-(--public-primary) shadow-sm backdrop-blur-sm">
            {doctor.specialityName}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-5 sm:p-6">
        <h3 className="text-base font-bold text-slate-900 sm:text-lg">{doctor.name}</h3>

        {doctor.qualification && <p className="text-sm text-slate-500">{doctor.qualification}</p>}

        {doctor.experience && <p className="text-sm text-slate-500">{doctor.experience}</p>}

        {doctor.satisfactionScore && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <Star className="size-4 fill-(--public-accent) text-(--public-accent)" aria-hidden="true" />
            {doctor.satisfactionScore} Patient Satisfaction
          </p>
        )}

        {(doctor.hospitalName || doctor.cityName) && (
          <p className="flex items-start gap-1.5 text-sm text-slate-500">
            <MapPin className="mt-0.5 size-4 shrink-0 text-(--public-primary)/60" aria-hidden="true" />
            <span className="line-clamp-2">
              {doctor.hospitalName && doctor.cityName
                ? `${doctor.hospitalName}, ${doctor.cityName}`
                : doctor.hospitalName || doctor.cityName}
            </span>
          </p>
        )}

        <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold text-(--public-primary) transition-colors group-hover:text-(--public-accent)">
          View Profile
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
