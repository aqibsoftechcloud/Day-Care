"use client";

import { useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HomepageBlog } from "@/lib/public/homepage";
import { BlogCard } from "./BlogCard";

type BlogsCarouselProps = {
  blogs: HomepageBlog[];
};

/**
 * The editorial blog marquee: embla-carousel-react + embla-carousel-
 * autoplay, the exact same pair already used by DoctorCarousel — no new
 * library. `loop: true` (when there's more than one blog) so the strip
 * feels continuous; Embla clones a few slide nodes internally to make
 * the loop seamless (the library's own established behavior, already
 * relied on by DoctorCarousel), not a custom duplicated-DOM marquee —
 * the `.map` below still emits exactly one tile per real blog, keyed by
 * its id.
 *
 * Autoplay is slower than the Doctors marquee (4200ms vs 3200ms) — a
 * calmer, more "editorial strip" pace than a continuous marquee feel.
 * `stopOnMouseEnter: true` + `stopOnInteraction: false` gives the
 * required hover-pauses / drag-or-arrow-only-pauses / resumes-without-
 * jumping-back-to-the-start flow, identical to every other autoplay
 * carousel on this site.
 */
export function BlogsCarousel({ blogs }: BlogsCarouselProps) {
  const prefersReducedMotion = useReducedMotion();
  const canLoop = blogs.length > 1;
  const enableAutoplay = canLoop && !prefersReducedMotion;

  // Lazy `useState` initializer, not a ref: the plugin instance must stay
  // referentially stable across renders (Embla reads it once at init),
  // and reading it during render is a normal state read — see the
  // identical note on DoctorCarousel, where this pattern originates.
  const [autoplayPlugin] = useState(() =>
    Autoplay({
      delay: 4200,
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
          {blogs.map((blog, index) => (
            <motion.div
              key={blog.id}
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.08 }}
              className="min-w-0 flex-[0_0_84%] sm:flex-[0_0_58%] md:flex-[0_0_44%] lg:flex-[0_0_31%] xl:flex-[0_0_24%]"
            >
              <BlogCard blog={blog} />
            </motion.div>
          ))}
          {!canLoop && <div className="w-px shrink-0 sm:w-4 lg:w-8" aria-hidden="true" />}
        </div>
      </div>

      {blogs.length > 1 && (
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Previous articles"
            className="flex size-11 items-center justify-center rounded-full border border-slate-200 text-(--public-primary) transition-colors hover:bg-(--public-primary) hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Next articles"
            className="flex size-11 items-center justify-center rounded-full border border-slate-200 text-(--public-primary) transition-colors hover:bg-(--public-primary) hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
