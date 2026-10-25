"use client";

import { useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HomepageDoctor } from "@/lib/public/homepage";
import { DoctorCard } from "./DoctorCard";

type DoctorCarouselProps = {
  doctors: HomepageDoctor[];
};

/**
 * The marquee-style doctor carousel: embla-carousel-react (already used by
 * HospitalCarousel, no new library) plus embla-carousel-autoplay (already
 * an installed dependency — confirmed in package.json before writing this,
 * no new plugin was installed). `loop: true` here (unlike the Hospitals
 * carousel, which is a bounded, non-looping "scroll to the end" carousel)
 * — this section is explicitly meant to feel like a continuous marquee.
 * Embla loops the REAL slides internally; nothing is duplicated in React's
 * render output (the .map below still emits exactly one card per doctor,
 * keyed by its real id).
 *
 * Autoplay behavior — `stopOnMouseEnter: true` + `stopOnInteraction: false`
 * together produce exactly the required flow: hover pauses it; dragging or
 * clicking an arrow also only pauses it (never kills it permanently); it
 * always resumes from wherever the carousel currently sits, never jumping
 * back to the first slide.
 */
export function DoctorCarousel({ doctors }: DoctorCarouselProps) {
  const prefersReducedMotion = useReducedMotion();
  const canLoop = doctors.length > 1;
  const enableAutoplay = canLoop && !prefersReducedMotion;

  // The plugin instance must stay referentially stable across renders (Embla
  // reads it once at init) — `useState`'s lazy initializer creates it
  // exactly once and reading it during render is a normal state read
  // (unlike reading a ref's `.current` during render, which the React
  // Compiler's stricter lint rule flags even for the equivalent lazy-ref-init
  // idiom).
  const [autoplayPlugin] = useState(() =>
    Autoplay({
      delay: 3200,
      stopOnMouseEnter: true,
      stopOnInteraction: false,
      stopOnFocusIn: true,
    })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { align: "start", loop: canLoop, containScroll: canLoop ? false : "trimSnaps" },
    enableAutoplay ? [autoplayPlugin] : []
  );

  return (
    <div>
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex gap-5">
          {doctors.map((doctor, index) => (
            <motion.div
              key={doctor.id}
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.08 }}
              className="min-w-0 flex-[0_0_84%] sm:flex-[0_0_58%] md:flex-[0_0_44%] lg:flex-[0_0_31%] xl:flex-[0_0_26%]"
            >
              <DoctorCard doctor={doctor} />
            </motion.div>
          ))}
          {!canLoop && <div className="w-px shrink-0 sm:w-4 lg:w-8" aria-hidden="true" />}
        </div>
      </div>

      {doctors.length > 1 && (
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Previous doctor"
            className="flex size-11 items-center justify-center rounded-full border border-slate-200 text-(--public-primary) transition-colors hover:bg-(--public-primary) hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Next doctor"
            className="flex size-11 items-center justify-center rounded-full border border-slate-200 text-(--public-primary) transition-colors hover:bg-(--public-primary) hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
