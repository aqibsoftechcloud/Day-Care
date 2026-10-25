import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { BlogCoverImage } from "./BlogCoverImage";
import { formatDate } from "@/lib/format-date";
import type { HomepageBlog } from "@/lib/public/homepage";

/**
 * One article card for the `/blogs` grid: fixed 16:10 cover (with the
 * branded fallback — see `BlogCoverImage`), category, date, a 2-line title,
 * a 3-line excerpt and a pinned "Read Article" row, so every card in a row
 * has the same height and the links line up. Listing-only on purpose: the
 * shared `BlogCard` (homepage, related articles, speciality/treatment
 * sections) is left exactly as it was. Only fields the CMS really has are
 * shown — no reading time or view counts are invented.
 */
export function BlogListingCard({ blog }: { blog: HomepageBlog }) {
  return (
    <article className="h-full">
      <Link
        href={blog.href}
        className="group flex h-full flex-col overflow-hidden rounded-(--public-radius-card) border border-slate-200 bg-white shadow-xs transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-(--public-accent)/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
      >
        <div className="relative aspect-16/10 w-full shrink-0">
          <BlogCoverImage
            src={blog.imageUrl}
            alt={blog.title}
            sizes="(min-width: 1280px) 400px, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
            className="transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            {blog.categoryName && (
              <span className="rounded-full bg-(--public-accent)/10 px-2.5 py-1 font-bold tracking-wide text-(--public-accent) uppercase">
                {blog.categoryName}
              </span>
            )}
            {blog.publishedDate && (
              <time className="inline-flex items-center gap-1.5 font-medium text-slate-500" dateTime={new Date(blog.publishedDate).toISOString()}>
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {formatDate(blog.publishedDate)}
              </time>
            )}
          </div>

          <h3 className="line-clamp-2 text-lg leading-snug font-bold text-(--public-primary) transition-colors group-hover:text-(--public-accent)">
            {blog.title}
          </h3>

          {blog.excerpt && <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{blog.excerpt}</p>}

          <span className="mt-auto inline-flex min-h-11 items-center gap-1.5 pt-1 text-sm font-bold text-(--public-primary) transition-colors group-hover:text-(--public-accent)">
            Read Article
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}
