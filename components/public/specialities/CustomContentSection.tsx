"use client";

import { useState } from "react";
import Image from "next/image";
import type { PublicSpecialitySectionItem } from "@/lib/public/specialities";

type CustomContentSectionProps = {
  section: Extract<PublicSpecialitySectionItem, { kind: "custom" }>;
};

/**
 * ONE generic, reusable renderer for every admin-authored custom content
 * section — never a per-speciality/per-section component
 * (SpecialityAboutEnt.tsx, SpecialityCommonConditions.tsx, etc. are
 * exactly what this replaces). The CMS's stored title/rich-text/image
 * fully determines the content; this component has no knowledge of any
 * particular speciality. Matches the existing DCS public Speciality page
 * visual language (`public-container`, the same heading scale
 * `SectionHeader` uses, `.rte-content` for rich text) rather than
 * inventing a new design system — same layout convention as
 * `SpecialityOverview.tsx`'s image/content split: image beside content
 * on desktop, stacked on mobile, and the layout collapses to a single
 * column entirely when there's no image, exactly like `PageAboutSection.tsx`.
 *
 * The image container is deliberately NOT aspect-ratio-locked (no
 * `aspect-square`/`aspect-4/3`) — admins upload images of any real-world
 * dimension (a wide 1140×551 landscape photo, a tall diagram, anything),
 * and locking to a fixed ratio combined with `object-cover` would crop
 * whichever dimension doesn't match. Instead this is a bounded "display
 * window" (a fixed height range, full width) with `object-contain`: the
 * whole image always stays visible at its own natural aspect ratio,
 * letterboxed (never cropped or stretched) within the window when its
 * proportions don't fill it exactly. The window's height is capped so an
 * unusually large upload never dominates the page, and the surrounding
 * card background (same token every other image placeholder on this page
 * uses) makes any letterbox space read as intentional, not like a bug.
 */
export function CustomContentSection({ section }: CustomContentSectionProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(section.imageUrl) && !imageFailed;

  return (
    <section aria-labelledby={`speciality-custom-section-${section.id}`} className="public-container py-16 sm:py-20">
      <div className={`grid grid-cols-1 items-center gap-10 ${showImage ? "lg:grid-cols-[1.2fr_1fr]" : ""}`}>
        <div>
          <h2
            id={`speciality-custom-section-${section.id}`}
            className="text-3xl font-black tracking-tight text-(--public-primary) sm:text-4xl"
          >
            {section.title}
          </h2>
          <div className="rte-content mt-6" dangerouslySetInnerHTML={{ __html: section.contentHtml }} />
        </div>

        {showImage && (
          <div className="relative h-64 w-full overflow-hidden rounded-(--public-radius-card) bg-(--public-primary)/5 sm:h-80 lg:h-96">
            <Image
              src={section.imageUrl as string}
              alt=""
              fill
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-contain"
              onError={() => setImageFailed(true)}
            />
          </div>
        )}
      </div>
    </section>
  );
}
