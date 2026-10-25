"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, UserRound } from "lucide-react";
import { formatDate } from "@/lib/format-date";
import type { HomepageBlog } from "@/lib/public/homepage";

type BlogCardProps = {
  blog: HomepageBlog;
  /**
   * Opt-in: also renders the excerpt and author row. Defaults to `false`
   * so every existing call site (Homepage marquee, Speciality/Treatment
   * sections, Blog Detail's Related Articles) keeps its exact current,
   * already-shipped appearance — only the Blog Listing page's own grid
   * passes `true`. Same "shared component, page-aware opt-in prop rather
   * than a global behavior change" precedent used elsewhere on this site
   * (e.g. `PublicFooter`'s `showAppointmentBanner`).
   */
  showExcerptAndAuthor?: boolean;
};

/**
 * A single editorial tile. Deliberately styled apart from Doctor/
 * Hospital/Review cards (no shadow, border-only, a smaller title,
 * category+arrow as a bottom accent label rather than a top eyebrow)
 * while still built entirely from the existing public tokens
 * (`--public-primary`/`--public-accent`/`--public-radius-card`) — a
 * different tile treatment, not a second design system.
 *
 * Only the fields the CMS actually has are shown — `blogs` has no
 * reading-time/view-count column (confirmed by reading the schema), so
 * none is invented here. Author avatar falls back to the same neutral
 * `UserRound` placeholder `BlogHero.tsx`/`HospitalReviews.tsx` already
 * use when no real image is configured.
 */
export function BlogCard({ blog, showExcerptAndAuthor = false }: BlogCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(blog.imageUrl) && !imageFailed;

  return (
    <Link
      href={blog.href}
      className="group flex h-full flex-col overflow-hidden rounded-(--public-radius-card) border border-slate-200 bg-white transition-colors hover:border-(--public-accent)/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
    >
      <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden bg-(--public-primary)/5">
        {showImage ? (
          <Image
            src={blog.imageUrl as string}
            alt={blog.title}
            fill
            sizes="(min-width: 1280px) 24vw, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 78vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-(--public-primary)/8 to-(--public-primary)/3">
            <BookOpen className="size-10 text-(--public-primary)/30" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5 sm:p-6">
        {blog.publishedDate && (
          <time className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{formatDate(blog.publishedDate)}</time>
        )}

        <h3 className="line-clamp-2 text-lg leading-snug font-bold text-(--public-primary) transition-colors group-hover:text-(--public-accent)">
          {blog.title}
        </h3>

        {showExcerptAndAuthor && blog.excerpt && (
          <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">{blog.excerpt}</p>
        )}

        {showExcerptAndAuthor && blog.authorName && (
          <div className="flex items-center gap-2">
            <span className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--public-primary)/8">
              {blog.authorImageUrl ? (
                <Image src={blog.authorImageUrl} alt="" fill sizes="24px" className="object-cover" />
              ) : (
                <UserRound className="size-3.5 text-(--public-primary)/40" aria-hidden="true" />
              )}
            </span>
            <span className="text-xs font-semibold text-slate-600">{blog.authorName}</span>
          </div>
        )}

        {blog.categoryName && (
          <span className="mt-auto inline-flex w-fit items-center gap-1.5 pt-2 text-xs font-bold tracking-[0.15em] text-(--public-accent) uppercase">
            {blog.categoryName}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        )}
      </div>
    </Link>
  );
}
