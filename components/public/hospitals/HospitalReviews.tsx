import Image from "next/image";
import { Star, UserRound } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import { ExpandableList } from "@/components/public/shared/ExpandableList";
import type { PublicHospitalReview } from "@/lib/public/hospitals";

type HospitalReviewsProps = {
  reviews: PublicHospitalReview[];
};

const INITIAL_LIMIT = 3;

/**
 * "What Our Patients Say" — same card shape as SpecialityTestimonials'
 * text-review cards (quote/author/location). Initially shows 3;
 * `ExpandableList` reveals the rest.
 *
 * Real data only — `testimonials.hospital_id`, resolved in
 * lib/public/hospitals.ts, never inferred from city, never mixed with
 * the separate `google_reviews` column (that's the Hero's single rating
 * number, a different field entirely). `testimonials` has no star-rating
 * column, so `review.rating` is always `null` for real data — the star
 * row only renders when it isn't, the one adapter change from the mock
 * version (which always had a rating).
 */
export function HospitalReviews({ reviews }: HospitalReviewsProps) {
  if (reviews.length === 0) return null;

  return (
    <section
      id="hospital-reviews-heading"
      aria-labelledby="hospital-reviews-title"
      className="public-container scroll-mt-20 py-10 sm:py-12"
    >
      <SectionHeader eyebrow="Patient Stories" title="What Our Patients Say" headingId="hospital-reviews-title" />

      <div className="mt-6">
        <ExpandableList
          items={reviews.map((review) => (
            <figure key={review.id} className="flex flex-col gap-3 rounded-(--public-radius-card) border border-slate-200 bg-white p-6 shadow-xs">
              {review.rating !== null && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      className={`size-4 ${index < review.rating! ? "fill-(--public-accent) text-(--public-accent)" : "text-slate-200"}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              )}
              <blockquote className="line-clamp-5 flex-1 text-sm leading-relaxed text-slate-600">{review.text}</blockquote>
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
                  <p className="truncate text-xs text-slate-500">
                    {review.date ? `${review.city} · ${review.date}` : review.city}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
          initialLimit={INITIAL_LIMIT}
          itemsClassName="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          moreLabel="View All Reviews"
        />
      </div>
    </section>
  );
}
