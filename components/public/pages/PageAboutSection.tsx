"use client";

import { useState } from "react";
import Image from "next/image";
import { toEditorContent, isEmptyEditorHtml } from "@/lib/rich-text";
import type { PublicAboutSection } from "@/lib/public/page-sections";

/**
 * `section.content` is rendered the same way `pages.body` already is in
 * `GenericPageBody.tsx` — `toEditorContent()` into `.rte-content` via
 * `dangerouslySetInnerHTML`, reusing that component's own documented
 * trust boundary rather than a new one (admin-authored, schema-
 * constrained Tiptap content only).
 */
export function PageAboutSection({ section }: { section: PublicAboutSection }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(section.imageUrl) && !imageFailed;
  const html = toEditorContent(section.content);
  const hasContent = html.length > 0 && !isEmptyEditorHtml(html);

  return (
    <section aria-labelledby={`page-about-${section.id}`} className="public-container py-16 sm:py-20">
      <div className={`grid grid-cols-1 items-center gap-10 ${showImage ? "lg:grid-cols-2" : ""}`}>
        <div>
          <h2 id={`page-about-${section.id}`} className="text-3xl font-black tracking-tight text-(--public-primary) sm:text-4xl">
            {section.heading}
          </h2>
          {hasContent && <div className="rte-content mt-6" dangerouslySetInnerHTML={{ __html: html }} />}
        </div>

        {showImage && (
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-(--public-radius-card) bg-(--public-primary)/5">
            <Image
              src={section.imageUrl as string}
              alt=""
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="object-cover"
              onError={() => setImageFailed(true)}
            />
          </div>
        )}
      </div>
    </section>
  );
}
