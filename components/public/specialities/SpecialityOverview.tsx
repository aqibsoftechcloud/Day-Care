"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import type { PublicSpecialityDetail } from "@/lib/public/specialities";

type SpecialityOverviewProps = {
  detail: PublicSpecialityDetail;
};

/**
 * `detail.description` is already an array of plain-text paragraphs —
 * `resolvePublicSpeciality` runs the admin's rich-text HTML through
 * `splitHtmlToParagraphs` before this component ever sees it (this
 * project has no HTML sanitizer, so the raw Tiptap output is never
 * passed here, and never rendered with `dangerouslySetInnerHTML`). The
 * first paragraph doubles as `SectionHeader`'s supporting intro line; any
 * remaining paragraphs render as a separate readable block below it, so
 * a multi-paragraph description isn't collapsed into one line.
 *
 * The right column is `detail.imageUrl` — the speciality's own real
 * `speciality_logo` field (the same image the Hero used to show as a
 * small circular icon), reused here at a larger, more editorial size
 * rather than inventing a second image source. When a speciality has no
 * logo uploaded, a plain neutral placeholder panel renders instead (never
 * a fabricated or stock image), so the two-column layout stays balanced
 * either way. Renders nothing at all when the speciality has no
 * description, since that's this section's own reason to exist.
 */
export function SpecialityOverview({ detail }: SpecialityOverviewProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(detail.imageUrl) && !imageFailed;

  if (detail.description.length === 0) {
    return null;
  }

  const [intro, ...rest] = detail.description;

  return (
    <section aria-labelledby="speciality-overview-heading" className="public-container py-16 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <SectionHeader
            eyebrow="Overview"
            title={`About ${detail.name}`}
            headingId="speciality-overview-heading"
            description={intro}
          />

          {rest.length > 0 && (
            <div className="mt-6 flex flex-col gap-4">
              {rest.map((paragraph, index) => (
                <p key={index} className="text-base leading-relaxed text-slate-600">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="relative aspect-4/3 w-full overflow-hidden rounded-(--public-radius-card) bg-(--public-primary)/5 lg:aspect-square">
          {showImage ? (
            <Image
              src={detail.imageUrl as string}
              alt={detail.name}
              fill
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-(--public-primary)/8 to-(--public-primary)/3">
              <ImageIcon className="size-12 text-(--public-primary)/30" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
