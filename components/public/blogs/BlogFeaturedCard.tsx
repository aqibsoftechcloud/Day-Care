import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { BlogCoverImage } from "./BlogCoverImage";
import { formatDate } from "@/lib/format-date";
import type { HomepageBlog } from "@/lib/public/homepage";

/**
 * The `is_featured` active blog as a large two-column article card on the
 * `/blogs` listing: big cover (branded fallback via `BlogCoverImage`),
 * category, date, title, excerpt and a "Read Article" link. Listing-only,
 * so it can't affect Blog Detail or any other page.
 */
export function BlogFeaturedCard({ blog }: { blog: HomepageBlog }) {
  return (
    <article>
      <Link
        href={blog.href}
        className="group grid overflow-hidden rounded-(--public-radius-card) border border-slate-200 bg-white shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-(--public-accent)/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2 lg:grid-cols-[1.15fr_1fr]"
      >
        <div className="relative aspect-16/10 w-full lg:aspect-auto lg:min-h-[360px]">
          <BlogCoverImage
            src={blog.imageUrl}
            alt={blog.title}
            sizes="(min-width: 1024px) 55vw, 100vw"
            priority
            className="transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>

        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <span className="rounded-full bg-(--public-primary) px-2.5 py-1 font-bold tracking-wide text-white uppercase">Featured</span>
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

          <h2 className="text-2xl leading-tight font-black tracking-tight text-(--public-primary) transition-colors group-hover:text-(--public-accent) sm:text-3xl">
            {blog.title}
          </h2>

          {blog.excerpt && <p className="line-clamp-4 text-base leading-relaxed text-slate-600">{blog.excerpt}</p>}

          <span className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-(--color-cta-primary-bg) px-5 text-sm font-semibold text-(--color-cta-primary-text) transition-colors group-hover:bg-(--color-cta-primary-bg)/90">
            Read Article
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}
