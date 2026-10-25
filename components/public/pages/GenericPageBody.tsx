import { toEditorContent, isEmptyEditorHtml } from "@/lib/rich-text";
import { SafeHtml } from "@/components/public/shared/SafeHtml";
import { getPublicPageSections } from "@/lib/public/page-sections";
import { PageSectionRenderer } from "./PageSectionRenderer";
import type { PublicPage } from "@/lib/public/root-resolver";

type GenericPageBodyProps = {
  page: PublicPage;
};

/**
 * Renders a generic CMS Page: real structured `page_sections` when the
 * page has any active ones, in their `section_order` (never a hardcoded
 * order here — see `getPublicPageSections`); otherwise falls back to the
 * legacy single `body` field, exactly as before this feature — `body` is
 * kept for backward compatibility and is never auto-migrated into
 * sections (see services/page-section.service.ts's own doc comments).
 *
 * `body` goes through `toEditorContent()` (upgrades legacy plain-text
 * rows to equivalent HTML; passes real Tiptap-produced HTML through
 * unchanged) into `.rte-content` via `dangerouslySetInnerHTML` — reusing
 * `components/admin/pages/PageViewDialog.tsx`'s own documented trust
 * boundary rather than inventing a new one: this content is only ever
 * authored through the schema-constrained Tiptap editor by a
 * permissioned admin user, and this project has no separate HTML
 * sanitizer because none is needed for that trust boundary. A Page that
 * genuinely has no sections and no body yet still shows "Content coming
 * soon." — never a fabricated fallback.
 */
export async function GenericPageBody({ page }: GenericPageBodyProps) {
  const sections = await getPublicPageSections(page.id);

  if (sections.length > 0) {
    const hasHero = sections.some((section) => section.type === "hero");

    return (
      <>
        {/* Every page needs exactly one real <h1> for SEO/accessibility — the
            Hero section already renders one; only add this hidden fallback
            when a page's sections don't include a Hero. */}
        {!hasHero && <h1 className="sr-only">{page.title}</h1>}
        {sections.map((section) => (
          <PageSectionRenderer key={`${section.type}-${section.id}`} section={section} />
        ))}
      </>
    );
  }

  const html = page.body ? toEditorContent(page.body) : "";
  const hasContent = html.length > 0 && !isEmptyEditorHtml(html);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="text-3xl font-black tracking-tight text-(--public-primary) sm:text-4xl">{page.title}</h1>
      {hasContent ? (
        <SafeHtml className="rte-content mt-8" html={html} />
      ) : (
        <p className="mt-4 text-sm text-slate-500">Content coming soon.</p>
      )}
    </div>
  );
}
