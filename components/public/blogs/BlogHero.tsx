import { getBlogsUrl } from "@/lib/public/urls";
import Image from "next/image";
import { CalendarDays, Newspaper, UserRound } from "lucide-react";
import { formatDate } from "@/lib/format-date";
import { AppointmentLeadForm } from "@/components/public/home/AppointmentLeadForm";
import type { PublicBlogDetail } from "@/lib/public/blogs";
import { PublicBreadcrumb } from "@/components/public/shared/PublicBreadcrumb";

type BlogHeroProps = {
  detail: PublicBlogDetail;
};

/**
 * Breadcrumb + title + author/date/category meta row + featured image,
 * paired with a sticky lead-capture sidebar — same two-column
 * `lg:grid-cols-[_fr_1fr]` + `AppointmentLeadForm` pairing
 * `HospitalHero.tsx` already established, reused verbatim rather than
 * building a second appointment system. `specialityName` is passed the
 * blog's own category name (the closest real topical anchor this schema
 * has — `blogs` has no speciality/treatment relation), same "display
 * copy only, never submitted" treatment the prop already documents.
 *
 * "Blogs" in the breadcrumb is plain text, not a link — no `/blogs`
 * listing page exists yet (explicitly out of this task's scope), same
 * "don't link to a 404" precedent `HospitalHero.tsx`/`SpecialityHero.tsx`
 * already established for their own breadcrumbs. The category segment is
 * plain text for the same reason (`/blogs/category/{seoUrl}` isn't built
 * yet either).
 *
 * Author avatar falls back to the same neutral `UserRound` placeholder
 * `HospitalReviews.tsx`/`DoctorCard.tsx` already use when no real image
 * is configured — never a fabricated/stock person photo. The whole
 * author row only renders when `authorName` is actually set (`blogs` has
 * no column that's always populated for this), never a fabricated byline.
 *
 * Breadcrumb lives in its own `public-container pt-4` div, structurally
 * separated from the content div below it — the same split
 * `GlobalHero.tsx` (the canonical breadcrumb-position reference for the
 * whole site) uses, standardizing the breadcrumb's distance from the
 * navbar across pages. The content div's `pt-4` replaces what used to be
 * a `mt-4` margin on the content grid itself — same 16px gap, preserved
 * exactly. `pb-6 sm:pb-8` (this Hero's own bottom spacing, from the old
 * shared `py-6 sm:py-8`) is also untouched.
 */
export function BlogHero({ detail }: BlogHeroProps) {
  return (
    <section aria-labelledby="blog-hero-heading" className="w-full border-b border-slate-200 bg-slate-50">
      <div className="relative z-10 public-container pt-4">
        <PublicBreadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Blogs", href: getBlogsUrl() },
            { label: detail.title },
          ]}
        />
      </div>

      <div className="relative z-10 public-container pb-6 pt-4 sm:pb-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.6fr_1fr] lg:gap-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-(--public-primary)/8 px-3 py-1 text-xs font-bold tracking-[0.1em] text-(--public-primary) uppercase">
                <Newspaper className="size-3.5" aria-hidden="true" />
                {detail.category.name}
              </span>
              {detail.isFeatured && (
                <span className="inline-flex items-center rounded-full bg-(--public-accent)/10 px-3 py-1 text-xs font-bold tracking-[0.1em] text-(--public-accent) uppercase">
                  Featured
                </span>
              )}
            </div>

            <h1 id="blog-hero-heading" className="mt-3 text-2xl font-black tracking-tight text-(--public-primary) sm:text-3xl lg:text-4xl">
              {detail.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
              {detail.authorName && (
                <div className="flex items-center gap-2.5">
                  <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--public-primary)/8">
                    {detail.authorImageUrl ? (
                      <Image src={detail.authorImageUrl} alt="" fill sizes="36px" className="object-cover" />
                    ) : (
                      <UserRound className="size-4.5 text-(--public-primary)/40" aria-hidden="true" />
                    )}
                  </span>
                  <span className="text-sm font-semibold text-slate-700">{detail.authorName}</span>
                </div>
              )}
              {detail.publishedDate && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <CalendarDays className="size-4 text-(--public-primary)/50" aria-hidden="true" />
                  {formatDate(detail.publishedDate)}
                </span>
              )}
            </div>

            {detail.imageUrl && (
              <div className="relative mt-6 aspect-16/9 w-full overflow-hidden rounded-(--public-radius-card) bg-(--public-primary)/5 sm:aspect-21/9">
                <Image
                  src={detail.imageUrl}
                  alt={detail.title}
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            )}
          </div>

          <div className="mx-auto w-full max-w-md lg:sticky lg:top-24 lg:mx-0">
            <AppointmentLeadForm />
          </div>
        </div>
      </div>
    </section>
  );
}
