"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HomepageHospital } from "@/lib/public/homepage";
import { HospitalCard } from "./HospitalCard";

type HospitalCarouselProps = {
  hospitals: HomepageHospital[];
};

/**
 * Horizontal, draggable hospital carousel (embla-carousel-react — already
 * an installed project dependency, not a new library). `loop: false` so
 * the arrows can be meaningfully disabled at each end rather than
 * wrapping around forever.
 */
export function HospitalCarousel({ hospitals }: HospitalCarouselProps) {
  const prefersReducedMotion = useReducedMotion();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    containScroll: "trimSnaps",
    skipSnaps: false,
  });

  // Starting guesses only, correct as soon as embla's own "reInit" (fires
  // once on mount, after it measures the real layout) or "select" event
  // calls setCanScrollPrev/setCanScrollNext below — the effect itself
  // only subscribes, it never calls setState synchronously in its body.
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(hospitals.length > 1);

  const updateButtons = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);
    return () => {
      emblaApi.off("select", updateButtons);
      emblaApi.off("reInit", updateButtons);
    };
  }, [emblaApi, updateButtons]);

  return (
    <div>
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex gap-4 pl-4 sm:gap-5 sm:pl-6 lg:pl-8">
          {hospitals.map((hospital, index) => (
            <motion.div
              key={hospital.id}
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.08 }}
              className="min-w-0 flex-[0_0_78%] sm:flex-[0_0_58%] md:flex-[0_0_44%] lg:flex-[0_0_38%] xl:flex-[0_0_31%]"
            >
              <HospitalCard hospital={hospital} />
            </motion.div>
          ))}
          {/* Trailing spacer so the last real card can be dragged fully into view instead of stopping flush against the viewport edge. */}
          <div className="w-px shrink-0 sm:w-4 lg:w-8" aria-hidden="true" />
        </div>
      </div>

      {hospitals.length > 1 && (
        <div className="mt-6 flex items-center justify-end gap-2 pr-4 sm:pr-6 lg:pr-8">
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canScrollPrev}
            aria-label="Previous hospital"
            className={cn(
              "flex size-11 items-center justify-center rounded-full border transition-colors",
              canScrollPrev
                ? "border-white/30 text-white hover:bg-white hover:text-(--public-primary)"
                : "border-white/10 text-white/30",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--public-primary)"
            )}
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canScrollNext}
            aria-label="Next hospital"
            className={cn(
              "flex size-11 items-center justify-center rounded-full border transition-colors",
              canScrollNext
                ? "border-white/30 text-white hover:bg-white hover:text-(--public-primary)"
                : "border-white/10 text-white/30",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--public-primary)"
            )}
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
