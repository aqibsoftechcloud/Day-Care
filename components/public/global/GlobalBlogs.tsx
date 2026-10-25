import { SectionHeader } from "@/components/public/shared/SectionHeader";
import { BlogCard } from "@/components/public/home/BlogCard";
import type { HomepageBlog } from "@/lib/public/homepage";

type GlobalBlogsProps = {
  blogs: HomepageBlog[];
};

/**
 * "From Our Blog" — real active Blogs, nationwide (no city filter; see
 * `lib/public/global-content.ts`'s `resolveGlobalBlogs()` for why this is
 * the one safe, already-established convention for blog content on a
 * city-independent page). Reuses the exact `BlogCard` every other blog
 * grid on this site already uses. Renders nothing when there are no
 * active blogs — never a fabricated placeholder.
 */
export function GlobalBlogs({ blogs }: GlobalBlogsProps) {
  if (blogs.length === 0) return null;

  return (
    <section aria-labelledby="global-blogs-heading" className="bg-white public-container py-10 sm:py-12">
      <SectionHeader eyebrow="From Our Blog" title="Related Reading" headingId="global-blogs-heading" />

      <div className="mt-8 grid grid-cols-1 gap-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
        {blogs.map((blog) => (
          <BlogCard key={blog.id} blog={blog} />
        ))}
      </div>
    </section>
  );
}
