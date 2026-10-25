import { SectionHeader } from "@/components/public/shared/SectionHeader";
import { BlogCard } from "@/components/public/home/BlogCard";
import type { PublicBlogDetail } from "@/lib/public/blogs";

type BlogRelatedProps = {
  blogs: PublicBlogDetail["relatedBlogs"];
};

/**
 * Other active blogs in the same category (see `lib/public/blogs.ts` —
 * `blogs` has no dedicated "related" relation, same audit finding behind
 * Speciality/Treatment's own blog sections). Reuses `BlogCard` verbatim,
 * same `HomepageBlog` DTO shape. Renders nothing when there are no other
 * blogs in this category.
 */
export function BlogRelated({ blogs }: BlogRelatedProps) {
  if (blogs.length === 0) return null;

  return (
    <section aria-labelledby="blog-related-heading" className="public-container py-10 sm:py-12">
      <SectionHeader eyebrow="Keep Reading" title="Related Articles" headingId="blog-related-heading" />
      <div className="mt-8 grid grid-cols-1 gap-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
        {blogs.map((blog) => (
          <BlogCard key={blog.id} blog={blog} />
        ))}
      </div>
    </section>
  );
}
