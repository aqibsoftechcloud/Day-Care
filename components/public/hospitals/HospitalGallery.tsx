"use client";

import { useEffect, useState } from "react";
import { Building2, X } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import type { PublicHospitalGalleryImage } from "@/lib/public/hospitals";

type HospitalGalleryProps = {
  images: PublicHospitalGalleryImage[];
};

/**
 * "Hospital at a Glance" — large primary tile on the left, a compact grid
 * of smaller tiles on the right. Real data only — `gallery.hospital_id`,
 * active images, ordered by `sorting_order` (see `getActiveHospitalGalleryItems`
 * in services/gallery.service.ts). A tile with no stored image source
 * (shouldn't happen for a real upload, but defensively handled) falls
 * back to the sitewide gradient+icon placeholder, same treatment
 * DoctorCard/HospitalCard already use for a missing image — never a
 * fabricated stock photo. Clicking any tile opens a simple modal/lightbox.
 */
export function HospitalGallery({ images }: HospitalGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenIndex(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openIndex]);

  if (images.length === 0) return null;

  const [primaryImage, ...restImages] = images;

  return (
    <section
      id="hospital-gallery-heading"
      aria-labelledby="hospital-gallery-title"
      className="public-container scroll-mt-20 py-10 sm:py-12"
    >
      <SectionHeader eyebrow="Gallery" title="Hospital at a Glance" headingId="hospital-gallery-title" />

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <GalleryTile image={primaryImage} className="aspect-[4/3] sm:aspect-auto sm:h-full" onClick={() => setOpenIndex(0)} />

        {restImages.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {restImages.map((image, index) => (
              <GalleryTile key={image.id} image={image} className="aspect-square" onClick={() => setOpenIndex(index + 1)} />
            ))}
          </div>
        )}
      </div>

      {openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Hospital photo viewer"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            aria-label="Close photo viewer"
            className="absolute top-5 right-5 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="size-6" aria-hidden="true" />
          </button>
          <div className="flex size-full max-h-[70vh] max-w-2xl items-center justify-center overflow-hidden rounded-(--public-radius-card) bg-gradient-to-br from-(--public-primary)/20 to-(--public-primary)/5">
            {images[openIndex]?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- lightbox view of an admin-uploaded/pasted gallery source, same unconstrained-host reasoning as HospitalCard.
              <img src={images[openIndex].imageUrl} alt={images[openIndex].name} className="size-full object-contain" />
            ) : (
              <Building2 className="size-20 text-(--public-primary)/50" aria-hidden="true" />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function GalleryTile({
  image,
  className,
  onClick,
}: {
  image: PublicHospitalGalleryImage;
  className: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-(--public-radius-card) bg-gradient-to-br from-(--public-primary)/8 to-(--public-primary)/3 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2 ${className}`}
      aria-label={`View larger photo: ${image.name}`}
    >
      {image.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded/pasted gallery source, unconstrained host.
        <img src={image.imageUrl} alt={image.name} className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center">
          <Building2 className="size-8 text-(--public-primary)/40 sm:size-10" aria-hidden="true" />
        </span>
      )}
    </button>
  );
}
