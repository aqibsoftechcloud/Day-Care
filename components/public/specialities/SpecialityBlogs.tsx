import { SectionHeader } from "@/components/public/shared/SectionHeader";
import { BlogCard } from "@/components/public/home/BlogCard";
import type { PublicSpecialityDetail } from "@/lib/public/specialities";

type SpecialityBlogsProps = {
  detail: PublicSpecialityDetail;
};

/**
 * Real active Blogs for this speciality's city (see
 * `resolvePublicSpeciality` — `blogs` has no speciality/treatment relation
 * column at all, so city is the closest genuine signal; this section never
 * claims relevance to the current speciality specifically). Reuses the
 * homepage's `BlogCard` verbatim. Renders nothing when the city has no
 * active blogs.
 */
export function SpecialityBlogs({ detail }: SpecialityBlogsProps) {
  if (detail.blogs.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="speciality-blogs-heading" className="public-container py-16 sm:py-20">
      <SectionHeader eyebrow="From Our Blog" title={`Reading from ${detail.cityName}`} headingId="speciality-blogs-heading" />

      <div className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
        {detail.blogs.slice(0, 3).map((blog) => (
          <BlogCard key={blog.id} blog={blog} />
        ))}
      </div>
    </section>
  );
}
