import { SectionHeader } from "@/components/public/shared/SectionHeader";
import { BlogCard } from "@/components/public/home/BlogCard";
import { ExpandableList } from "@/components/public/shared/ExpandableList";
import type { PublicTreatmentBlog } from "@/lib/public/treatments";

const INITIAL_LIMIT = 3;

/**
 * Real active blogs for this treatment's city — `blogs` has no treatment
 * relation column, so city is the closest real signal. Renders nothing
 * when the city has no active blogs. Initially shows 3 — `ExpandableList`
 * reveals the rest on demand (this previously hard-truncated to 3 with
 * `.slice(0, 3)` and no way to see the rest — that silent drop is
 * exactly what this change fixes).
 */
export function TreatmentBlogs({ cityName, blogs }: { cityName: string; blogs: PublicTreatmentBlog[] }) {
  if (blogs.length === 0) return null;

  return (
    <section aria-labelledby="treatment-blogs-heading" className="public-container py-10 sm:py-12">
      <SectionHeader eyebrow="From Our Blog" title={`Reading from ${cityName}`} headingId="treatment-blogs-heading" />

      <div className="mt-6">
        <ExpandableList
          items={blogs.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
          initialLimit={INITIAL_LIMIT}
          itemsClassName="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          moreLabel="View More Blogs"
        />
      </div>
    </section>
  );
}
