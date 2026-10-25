import { SafeHtml } from "@/components/public/shared/SafeHtml";

type BlogContentProps = {
  html: string;
};

/**
 * The full article body — reuses the exact `.rte-content` +
 * `dangerouslySetInnerHTML` convention `TreatmentContentBlock.tsx` /
 * `CustomContentSection.tsx` / `GenericPageBody.tsx` already established
 * for every other admin-authored Tiptap field on this site. No sanitizer
 * (same as those), no structural changes to the stored HTML — inline
 * images/links embedded in `blog_text` render as-is.
 */
export function BlogContent({ html }: BlogContentProps) {
  return (
    <section aria-label="Article content" className="public-container py-8 sm:py-10">
      <SafeHtml className="rte-content mx-auto max-w-225" html={html} />
    </section>
  );
}
