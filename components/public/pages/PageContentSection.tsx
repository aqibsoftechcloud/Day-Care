import { toEditorContent, isEmptyEditorHtml } from "@/lib/rich-text";
import { SafeHtml } from "@/components/public/shared/SafeHtml";
import type { PublicContentSection } from "@/lib/public/page-sections";

/** Same rich-text rendering approach as `PageAboutSection`/`GenericPageBody` — see their doc comments for the trust-boundary reasoning. */
export function PageContentSection({ section }: { section: PublicContentSection }) {
  const html = toEditorContent(section.content);
  const hasContent = html.length > 0 && !isEmptyEditorHtml(html);

  return (
    <section aria-labelledby={`page-content-${section.id}`} className="public-container py-16 sm:py-20">
      <h2 id={`page-content-${section.id}`} className="text-3xl font-black tracking-tight text-(--public-primary) sm:text-4xl">
        {section.heading}
      </h2>
      {hasContent && <SafeHtml className="rte-content mt-6" html={html} />}
    </section>
  );
}
