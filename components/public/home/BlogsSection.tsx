import { getHomepageBlogs } from "@/lib/public/homepage";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import { BlogsCarousel } from "./BlogsCarousel";

type BlogsSectionProps = {
  /** The already-resolved city id from the root resolver (`null` on the nationwide `/` homepage) — never re-derived here. */
  currentCityId: number | null;
};

/**
 * Server Component: fetches the current city's active blogs (mixed
 * nationwide when there's no city context, same convention already used
 * by Specialities/Treatments/Doctors) and hands them, as a public-safe
 * DTO, to the Client Component that needs interactivity (the marquee
 * carousel). Renders nothing when there are no active blogs — never an
 * empty shell, never a fabricated article.
 *
 * `getHomepageBlogs()` (unchanged by this redesign) already applies
 * `toLocalImageUrl` to `blog_image`, so a real CMS image renders and an
 * untrusted/invalid one safely falls back — no separate image-pipeline
 * fix was needed here, it already worked correctly.
 *
 * `getBlogs()`'s own intended ordering (unchanged, no new sort added
 * here) determines display order.
 *
 * No "View All Blogs" CTA: no `/blogs` route exists yet (confirmed: no
 * matching file under `app/(public)/`, still true as of this redesign)
 * — same pre-existing "page not built yet" gap already flagged for
 * every other homepage section's listing page, and out of this task's
 * explicit scope to build.
 */
export async function BlogsSection({ currentCityId }: BlogsSectionProps) {
  const blogs = await getHomepageBlogs(currentCityId);

  if (blogs.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="blogs-heading" className="public-container py-16 sm:py-20 lg:py-24">
      <SectionHeader
        eyebrow="Medical Insights"
        title="Latest from Day Care Surgeries"
        headingId="blogs-heading"
        description="Helpful information about treatments, procedures, recovery and healthcare."
      />

      <div className="mt-10 sm:mt-12">
        <BlogsCarousel blogs={blogs} />
      </div>
    </section>
  );
}
