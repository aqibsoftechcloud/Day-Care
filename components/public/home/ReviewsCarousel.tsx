"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { HomepageReview } from "@/lib/public/homepage";

type ReviewsCarouselProps = {
  reviews: HomepageReview[];
};

/**
 * Percentage-based positions (relative to the cloud container) for the
 * floating avatar bubbles, roughly tracing an oval around the center
 * stage — hand-placed to match the reference showcase rather than
 * computed from a formula, since a couple of bubbles are deliberately
 * different sizes for visual variety. Only as many positions as there
 * are real reviews are ever used (`index % length`, but in practice
 * `reviews` is capped at `HOMEPAGE_LIST_LIMIT` = 8, i.e. this exact
 * length) — a review count under 8 simply shows fewer floating bubbles,
 * never an empty placeholder one.
 */
const FLOAT_POSITIONS = [
  { top: "6%", left: "9%", size: "size-16" },
  { top: "42%", left: "2%", size: "size-12" },
  { top: "78%", left: "11%", size: "size-12" },
  { top: "18%", left: "27%", size: "size-11" },
  { top: "6%", left: "89%", size: "size-14" },
  { top: "40%", left: "97%", size: "size-16" },
  { top: "76%", left: "90%", size: "size-12" },
  { top: "18%", left: "73%", size: "size-11" },
];

function getInitial(name: string | null): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed[0]!.toUpperCase() : "?";
}

type ReviewAvatarProps = {
  review: HomepageReview;
  className: string;
};

/** Real uploaded photo when one exists (`review.avatar` is already filtered to same-origin `/uploads/...` paths, see `toLocalImageUrl`), otherwise a soft rose/coral gradient circle with the author's first initial — never a stock or fabricated photo. */
function ReviewAvatar({ review, className }: ReviewAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(review.avatar) && !imageFailed;

  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-full bg-white", className)}>
      {showImage ? (
        <Image
          src={review.avatar as string}
          alt={review.author ?? "Patient"}
          fill
          sizes="120px"
          className="object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-200 via-orange-100 to-rose-100 font-bold text-rose-600">
          {getInitial(review.author)}
        </div>
      )}
    </div>
  );
}

type ReviewStageProps = {
  review: HomepageReview;
  avatarSizeClass: string;
  prefersReducedMotion: boolean;
};

/** The large center avatar (dashed rotating ring) plus the animated quote/author block — shared between the desktop cloud layout and the mobile fallback so both stay in sync without duplicating the transition logic. */
function ReviewStage({ review, avatarSizeClass, prefersReducedMotion }: ReviewStageProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative">
        <div
          className="absolute -inset-3 rounded-full border-2 border-dashed border-rose-300 animate-spin-slow motion-reduce:animate-none"
          aria-hidden="true"
        />
        <ReviewAvatar review={review} className={cn(avatarSizeClass, "ring-4 ring-white shadow-xl")} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={review.id}
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mt-6 max-w-lg"
          aria-live="polite"
        >
          <p className="text-base leading-relaxed text-slate-600 sm:text-lg">&ldquo;{review.text}&rdquo;</p>
          <p className="mt-4 text-base font-semibold text-rose-500">
            {review.author ?? "Verified Patient"}
            {review.location && <span className="font-normal text-slate-400"> · {review.location}</span>}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Interactive showcase replacing the old Embla card carousel: a cloud of
 * floating patient avatars (desktop/tablet) or a scrollable thumbnail row
 * (mobile) lets a visitor bring any review to the center stage. Renders
 * nothing when `reviews` is empty — `ReviewsSection` already guards this,
 * this is just a defensive second check, same convention as every other
 * homepage carousel.
 */
export function ReviewsCarousel({ reviews }: ReviewsCarouselProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const active = reviews[activeIndex];

  if (!active) {
    return null;
  }

  return (
    <div>
      {/* ---------------- Desktop / tablet: floating avatar cloud ---------------- */}
      <div className="relative mx-auto hidden h-[420px] max-w-3xl md:block">
        {reviews.map((review, index) => {
          const position = FLOAT_POSITIONS[index % FLOAT_POSITIONS.length]!;
          const isActive = index === activeIndex;

          return (
            <motion.button
              key={review.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show review from ${review.author ?? "this patient"}`}
              aria-pressed={isActive}
              animate={prefersReducedMotion ? undefined : { y: [0, -8, 0] }}
              transition={
                prefersReducedMotion
                  ? undefined
                  : {
                      duration: 3.2 + (index % 3) * 0.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.25,
                    }
              }
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
              style={{ top: position.top, left: position.left }}
            >
              <ReviewAvatar
                review={review}
                className={cn(
                  position.size,
                  "ring-4 transition-shadow",
                  isActive ? "ring-rose-400 shadow-[0_0_0_6px_rgba(244,63,94,0.15)]" : "ring-white shadow-md"
                )}
              />
            </motion.button>
          );
        })}

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <ReviewStage review={active} avatarSizeClass="size-28" prefersReducedMotion={Boolean(prefersReducedMotion)} />
        </div>
      </div>

      {/* ---------------- Mobile: stage + scrollable thumbnail row ---------------- */}
      <div className="md:hidden">
        <ReviewStage review={active} avatarSizeClass="size-24" prefersReducedMotion={Boolean(prefersReducedMotion)} />

        {reviews.length > 1 && (
          <div className="mt-7 flex justify-center gap-3 overflow-x-auto px-1 pb-2" role="tablist" aria-label="Choose a review">
            {reviews.map((review, index) => (
              <button
                key={review.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Show review from ${review.author ?? "this patient"}`}
                onClick={() => setActiveIndex(index)}
                className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
              >
                <ReviewAvatar
                  review={review}
                  className={cn("size-12 ring-2", index === activeIndex ? "ring-rose-400" : "ring-transparent")}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
