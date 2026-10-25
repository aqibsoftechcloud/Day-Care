"use client";

import { useState } from "react";
import Image from "next/image";
import type { PublicTreatmentDetail } from "@/lib/public/treatments";

type TreatmentMedicalIllustrationProps = {
  detail: PublicTreatmentDetail;
};

/**
 * Reuses the treatment's existing single image field (`speciality_logo`,
 * already surfaced as `detail.imageUrl`) as a real, large editorial
 * image directly beneath the Overview article — matching the reference's
 * full-width medical illustration, not a small thumbnail in a card. When
 * no image exists, renders nothing rather than a placeholder box (a
 * missing illustration shouldn't leave an empty grey slab in the middle
 * of the article). The earlier audit flagged "does the CMS support a
 * second/dedicated illustration image" as a genuine gap — Phase 3 can
 * resolve it via a `custom` section's own image field (already
 * supported) instead of a new DB column.
 *
 * The wrapper's aspect ratio tracks the image's own real
 * `naturalWidth`/`naturalHeight` (read via `onLoad`, a standard
 * `next/image` pattern) rather than a fixed `h-72 sm:h-96` box — `detail`
 * has no stored width/height for this field, so a fixed box is a guess
 * that's wrong whenever the real image isn't that same wide-landscape
 * shape (confirmed live: a real 83×83 square image rendered inside the
 * old 880×384 box, leaving large grey pillarboxing on both sides — the
 * exact reported bug). `aspect-4/3` is only the fallback shown for the
 * brief instant before the real image has loaded; once `onLoad` fires,
 * the wrapper snaps to the image's actual ratio, so the box always ends
 * up exactly fitting the image with zero leftover space — never cropped
 * (`object-contain` throughout, including during that fallback instant)
 * and never distorted (the box, not the image, adapts).
 *
 * `max-w-150` (600px) keeps this a supporting content image, not a
 * full-width hero-sized one — the previous `max-w-225` (900px) correctly
 * fixed the aspect-ratio/pillarboxing bug but, now that the box always
 * exactly matches the image, let it render far taller/larger than this
 * editorial placement calls for. `w-full` still caps it to the real
 * available width on mobile/tablet, so it only ever reaches 600px on
 * desktop where the content column is wide enough.
 */
export function TreatmentMedicalIllustration({ detail }: TreatmentMedicalIllustrationProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [naturalRatio, setNaturalRatio] = useState<number | null>(null);
  const showImage = Boolean(detail.imageUrl) && !imageFailed;

  if (!showImage) return null;

  return (
    <section className="public-container pb-8 sm:pb-10 lg:pr-125">
      <div
        className="relative aspect-4/3 w-full max-w-150 overflow-hidden rounded-lg bg-(--public-primary)/5"
        style={naturalRatio ? { aspectRatio: naturalRatio } : undefined}
      >
        <Image
          src={detail.imageUrl as string}
          alt={detail.name}
          fill
          sizes="(min-width: 768px) 600px, 90vw"
          className="object-contain"
          onLoad={(event) => {
            const img = event.currentTarget;
            if (img.naturalWidth && img.naturalHeight) {
              setNaturalRatio(img.naturalWidth / img.naturalHeight);
            }
          }}
          onError={() => setImageFailed(true)}
        />
      </div>
    </section>
  );
}
