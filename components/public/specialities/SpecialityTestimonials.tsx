"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { PlayCircle, Quote, UserRound } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import type { PublicSpecialityDetail } from "@/lib/public/specialities";

type SpecialityTestimonialsProps = {
  detail: PublicSpecialityDetail;
};

/**
 * Real active Testimonials — prefers ones genuinely linked to this
 * speciality (`testimonials.speciality_id`), falling back to the
 * speciality's own city only when none are linked yet (see
 * `resolvePublicSpeciality`/`resolveSpecialityTestimonials`). The heading
 * reflects which case applied rather than overclaiming relevance.
 *
 * Two independent, always-vertically-stacked sections — no tabs, no
 * shared container: Text Patient Stories (testimonials with real text
 * content) and Patient Video Testimonials (testimonials with a
 * `youtube_url`), each rendering only when its own filtered list is
 * non-empty. A testimonial with both text and video content is eligible
 * to appear in both sections — that's the same testimonial shown in two
 * different, genuinely different presentations (a quote to read vs. a
 * video to watch), not a duplicate. Renders nothing at all when neither
 * list has data.
 */
export function SpecialityTestimonials({ detail }: SpecialityTestimonialsProps) {
  const textTestimonials = useMemo(
    () => detail.testimonials.filter((t) => t.text.length > 0).slice(0, 6),
    [detail.testimonials]
  );
  const videoTestimonials = useMemo(
    () => detail.testimonials.filter((t) => t.youtubeVideoId !== null).slice(0, 6),
    [detail.testimonials]
  );

  if (textTestimonials.length === 0 && videoTestimonials.length === 0) {
    return null;
  }

  return (
    <>
      {textTestimonials.length > 0 && (
        <section aria-labelledby="speciality-testimonials-text-heading" className="bg-slate-50">
          <div className="public-container py-16 sm:py-20">
            <SectionHeader
              eyebrow="Patient Stories"
              title={
                detail.testimonialsAreSpecialitySpecific
                  ? `What ${detail.name} patients say`
                  : `What patients in ${detail.cityName} say`
              }
              headingId="speciality-testimonials-text-heading"
              align="center"
            />

            <div className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
              {textTestimonials.map((review) => (
                <figure
                  key={review.id}
                  className="flex flex-col gap-4 rounded-(--public-radius-card) border border-slate-200 bg-white p-6 shadow-xs"
                >
                  <Quote className="size-6 text-(--public-accent)/60" aria-hidden="true" />
                  <blockquote className="line-clamp-6 flex-1 text-sm leading-relaxed text-slate-600 sm:text-base">
                    {review.text}
                  </blockquote>
                  <figcaption className="flex items-center gap-3 border-t border-slate-100 pt-4">
                    <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--public-primary)/8">
                      {review.avatar ? (
                        <Image src={review.avatar} alt="" fill sizes="40px" className="object-cover" />
                      ) : (
                        <UserRound className="size-5 text-(--public-primary)/40" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{review.author ?? "Verified Patient"}</p>
                      {review.location && <p className="truncate text-xs text-slate-500">{review.location}</p>}
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {videoTestimonials.length > 0 && (
        <section aria-labelledby="speciality-testimonials-video-heading" className="bg-slate-50">
          <div className="public-container py-16 sm:py-20">
            <SectionHeader
              eyebrow="Patient Stories"
              title="Patient Video Testimonials"
              description="Hear directly from our patients"
              headingId="speciality-testimonials-video-heading"
              align="center"
            />

            <div className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
              {videoTestimonials.map((review) => (
                <VideoTestimonialCard key={review.id} review={review} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function VideoTestimonialCard({
  review,
}: {
  review: PublicSpecialityDetail["testimonials"][number];
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className="flex flex-col overflow-hidden rounded-(--public-radius-card) border border-slate-200 bg-white shadow-xs">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-slate-900">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${review.youtubeVideoId}?autoplay=1`}
            title={review.author ? `${review.author}'s video testimonial` : "Video testimonial"}
            className="absolute inset-0 size-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 flex items-center justify-center focus-visible:outline-none"
            aria-label={review.author ? `Play ${review.author}'s video testimonial` : "Play video testimonial"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- YouTube's own thumbnail CDN, not a next/image-controlled host. */}
            <img
              src={`https://img.youtube.com/vi/${review.youtubeVideoId}/hqdefault.jpg`}
              alt=""
              className="absolute inset-0 size-full object-cover opacity-80 transition-opacity group-hover:opacity-60"
            />
            <PlayCircle
              className="relative size-14 text-white drop-shadow-lg transition-transform group-hover:scale-110"
              aria-hidden="true"
            />
          </button>
        )}
      </div>
      <figcaption className="flex items-center gap-3 p-5">
        <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--public-primary)/8">
          {review.avatar ? (
            <Image src={review.avatar} alt="" fill sizes="36px" className="object-cover" />
          ) : (
            <UserRound className="size-4 text-(--public-primary)/40" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{review.author ?? "Verified Patient"}</p>
          {review.location && <p className="truncate text-xs text-slate-500">{review.location}</p>}
        </div>
      </figcaption>
    </figure>
  );
}
