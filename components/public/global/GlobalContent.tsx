"use client";

import Image from "next/image";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import type { PublicGlobalContentDetail } from "@/lib/public/global-content";

type GlobalContentProps = {
  detail: PublicGlobalContentDetail;
};

/**
 * Main description + every active content section, in their configured
 * order. The entity's own `imageUrl` is no longer rendered here — it now
 * displays in `GlobalHero.tsx` instead (same existing field, reused there
 * rather than shown twice), so this component is text-only for the main
 * description. Each per-section `section.imageUrl` below (a distinct,
 * independent field — one optional image per CMS content block, unrelated
 * to the entity's own main image) is untouched. Each CMS section keeps
 * the same `.rte-content` + `dangerouslySetInnerHTML` convention every
 * other admin-authored Tiptap field on this site already uses, with its
 * own H2 sized to match the city pages' section headings
 * (`TreatmentOverview.tsx`/`TreatmentFactsTable.tsx`'s
 * `text-2xl ... sm:text-[1.75rem]`).
 *
 * Both blocks are explicitly `bg-white`, mirroring
 * `TreatmentDetailPage.tsx`/`SpecialityDetailPage.tsx`'s own dispatcher
 * convention exactly: the page sits on a `bg-slate-50` base
 * (`GlobalDetailPage.tsx`) and each content block is its own white panel
 * on top of it — the same "cards on a grey page" rhythm the city pages
 * use, not a flat, undifferentiated article.
 *
 * `lg:pr-125` on both sections reserves real horizontal space for the
 * page-level sticky `AppointmentLeadForm` overlay (`GlobalDetailPage.tsx`
 * — spans Hero through this component). That overlay is `position:
 * absolute`/`sticky`, so it has no footprint in normal document flow;
 * without this reserved gutter, this component's own text has no
 * awareness of the form at all and can render underneath/behind it at
 * narrower desktop widths. The form itself right-aligns inside its own
 * `public-container` (unaffected by this padding), so its left edge
 * tracks that container's own growing right-side padding as the
 * breakpoint widens — `125` (500px) was sized against that actual
 * worst-case position at the `1440px` breakpoint (not just the form's
 * `400px` width) to keep a real ~40–80px visual gap at every
 * `public-container` breakpoint from `lg` up, verified via live
 * measurement rather than assumed from the class values alone.
 *
 * There is no separate, CMS-structured "Why Choose"/"Facts"/"Options"/
 * "Process"/etc. content type at the global level
 * (`global_speciality_sections`/`global_treatment_sections` are flat
 * title/content/image rows, unlike the city schema's many dedicated
 * section types with their own structured shapes) — so these CMS
 * sections are this page's full remaining content story, presented as
 * clean editorial blocks rather than forced into card/table/timeline
 * layouts that would misrepresent plain paragraph content as structured
 * data that doesn't actually exist.
 */
export function GlobalContent({ detail }: GlobalContentProps) {
  const hasDescription = detail.descriptionHtml.trim().length > 0;

  if (!hasDescription && detail.sections.length === 0) {
    return null;
  }

  return (
    <>
      {hasDescription && (
        <section aria-labelledby="global-overview-heading" className="bg-white public-container py-8 sm:py-10 lg:pr-125">
          <SectionHeader
            eyebrow="Overview"
            title={`About ${detail.name}`}
            headingId="global-overview-heading"
          />
          <div className="rte-content mt-6 max-w-225" dangerouslySetInnerHTML={{ __html: detail.descriptionHtml }} />
        </section>
      )}

      {detail.sections.length > 0 && (
        <section aria-label={`${detail.name} content`} className="bg-white public-container py-8 sm:py-10 lg:pr-125">
          <div className="flex flex-col gap-10">
            {detail.sections.map((section) => (
              <div key={section.id} className="max-w-225">
                <h2 className="text-2xl font-bold text-slate-900 sm:text-[1.75rem]">{section.title}</h2>
                {section.imageUrl && (
                  <div className="relative mt-5 h-64 w-full max-w-225 overflow-hidden rounded-lg bg-(--public-primary)/5 sm:h-80">
                    <Image src={section.imageUrl} alt="" fill sizes="(min-width: 768px) 900px, 90vw" className="object-contain" />
                  </div>
                )}
                {section.contentHtml && <div className="rte-content mt-5" dangerouslySetInnerHTML={{ __html: section.contentHtml }} />}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
