import { getHomepageReviews } from "@/lib/public/homepage";
import { ReviewsCarousel } from "./ReviewsCarousel";

/**
 * Server Component: fetches the active patient Testimonials once and
 * hands them, as a public-safe DTO, to the Client Component that needs
 * interactivity (the floating-avatar showcase). Renders nothing when
 * there are no active reviews — the homepage should stay visually clean
 * rather than show an empty gradient shell (matches the same "hide,
 * don't fake" rule every other homepage section already follows).
 *
 * Takes no `currentCityId` — same as before this section switched from
 * `google_reviews` to `testimonials` (see `getHomepageReviews`'s own
 * doc comment): this is a small, nationwide "what patients say"
 * showcase, not a per-city listing, so `/`, `/hyderabad`, and `/mumbai`
 * all see the same active set.
 *
 * Deliberately styled apart from the shared `SectionHeader` pattern
 * every other section uses (soft rose/coral accent, gradient
 * background, a plain-weight heading with the label below it instead
 * of an uppercase eyebrow above) — an explicit, one-off "patient
 * showcase" treatment for this section only, not a change to the
 * site-wide design system established for the rest of the homepage.
 */
export async function ReviewsSection() {
  const reviews = await getHomepageReviews();

  if (reviews.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="reviews-heading" className="bg-gradient-to-b from-[#f0f9fa]/80 via-[#f8fcfe] to-white">
      <div className="public-container py-16 sm:py-20 lg:py-24">
        <div className="text-center">
          <h2 id="reviews-heading" className="text-3xl font-medium tracking-tight text-slate-700 sm:text-4xl">
            What our patients have to say
          </h2>
          <p className="mt-2 text-sm font-semibold text-rose-500">#gratitude</p>
        </div>

        <div className="mt-12 sm:mt-16">
          <ReviewsCarousel reviews={reviews} />
        </div>
      </div>
    </section>
  );
}
