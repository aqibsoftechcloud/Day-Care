import { BookOpen } from "lucide-react";
import { BlogFeaturedCard } from "./BlogFeaturedCard";
import { BlogListingCard } from "./BlogListingCard";
import { BlogPagination } from "./BlogPagination";
import { PublicBreadcrumb } from "@/components/public/shared/PublicBreadcrumb";
import type { PublicBlogListing } from "@/lib/public/blogs";

type BlogListingPageProps = {
  listing: PublicBlogListing;
};

/**
 * Blog Listing page template — 100% CMS/database-driven via
 * `resolvePublicBlogListing()` (lib/public/blogs.ts): a compact breadcrumb + title intro (no banner), the
 * featured article (when one is marked `is_featured`), a 1/2/3-column grid
 * of articles, and numbered pagination. The public listing has no category
 * or search filtering in its data layer, so no filter bar is shown — adding
 * one that doesn't filter would be a fake control. With no published blogs
 * it shows a proper empty state.
 */
export function BlogListingPage({ listing }: BlogListingPageProps) {
  const { featured, items, page, totalPages } = listing;
  const hasArticles = Boolean(featured) || items.length > 0;

  return (
    <>
      <div className="bg-slate-50">
        <div className="public-container pb-10 pt-6 sm:pb-14 sm:pt-8">
          <header className="mb-6 sm:mb-8">
            <PublicBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Blogs" }]} />
            <h1 id="blog-listing-heading" className="mt-3 text-2xl font-black tracking-tight text-(--public-primary) sm:text-3xl">
              Blogs
            </h1>
          </header>

          {hasArticles ? (
            <>
              {featured && <BlogFeaturedCard blog={featured} />}

              {items.length > 0 && (
                <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 ${featured ? "mt-10 sm:mt-12" : ""}`}>
                  {items.map((blog) => (
                    <BlogListingCard key={blog.id} blog={blog} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-(--public-radius-card) border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-(--public-primary)/8 text-(--public-primary)">
                <BookOpen className="size-6" aria-hidden="true" />
              </span>
              <h2 className="text-lg font-bold text-(--public-primary)">No articles published yet</h2>
              <p className="text-sm text-slate-500">New health insights and surgery guides will appear here soon. Please check back shortly.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-10 sm:mt-12">
              <BlogPagination page={page} totalPages={totalPages} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
