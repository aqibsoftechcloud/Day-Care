import Image from "next/image";
import { SafeHtml } from "@/components/public/shared/SafeHtml";

type TreatmentContentBlockProps = {
  title: string;
  html: string;
  headingId: string;
  imageUrl?: string | null;
};

/**
 * Generic rich-content renderer for every admin-authored `custom`
 * section — matches `CustomContentSection.tsx`'s exact rendering
 * convention (`.rte-content` + `dangerouslySetInnerHTML`, no
 * server-side sanitizer, same as every other admin-authored HTML on
 * this site). Section uses the wide `public-container` (same left edge
 * as every other section); the prose itself is capped at a ~900px
 * reading width and left-aligned within it, not re-centered into its
 * own narrow container. Rendered once per active custom section, in
 * whatever order the admin has set — never a fixed count/position.
 */
export function TreatmentContentBlock({ title, html, headingId, imageUrl }: TreatmentContentBlockProps) {
  return (
    <section aria-labelledby={headingId} className="public-container py-8 sm:py-10 lg:pr-125">
      <h2 id={headingId} className="max-w-225 text-2xl font-bold text-slate-900 sm:text-[1.75rem]">
        {title}
      </h2>
      {imageUrl && (
        <div className="relative mt-5 h-64 w-full max-w-225 overflow-hidden rounded-lg bg-(--public-primary)/5 sm:h-80">
          <Image src={imageUrl} alt="" fill sizes="(min-width: 768px) 900px, 90vw" className="object-contain" />
        </div>
      )}
      <SafeHtml className="rte-content mt-5 max-w-225" html={html} />
    </section>
  );
}
