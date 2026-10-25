/**
 * HTML sanitization for the RichTextEditor's HTML source mode
 * (components/admin/editor/RichTextEditor.tsx) — deliberately a separate
 * module from lib/rich-text.ts, not merged into it: that file is pure
 * (no DOM dependency) and is imported from server-side code (e.g.
 * lib/public/specialities.ts, several validators), while this one wraps
 * DOMPurify, which requires a real `window`/`document` and only ever
 * runs in the browser. Importing this from a server module would throw
 * at import time.
 *
 * Every other HTML value in this project's editor already came from
 * Tiptap's own schema-constrained visual editing (typing/pasting into a
 * ProseMirror contenteditable can't itself inject a `<script>` tag) — the
 * HTML source textarea is the first place a CMS user can type genuinely
 * arbitrary text that later gets parsed as HTML, so it's the first place
 * that actually needs sanitizing before that HTML is trusted again.
 */
import DOMPurify from "dompurify";
import { isSafeUrl, toEditorContent } from "@/lib/rich-text";
import { ALLOWED_ATTR, ALLOWED_TAGS } from "@/lib/sanitize-html-config";

/**
 * Matches exactly the block/inline/table tags this project's Tiptap
 * schema already renders (StarterKit + TextAlign + Image + TableKit) —
 * see RichTextEditor.tsx's `extensions` list. Anything outside this
 * allowlist (script, style, iframe, object, embed, form, svg, link,
 * meta, base, event-bearing custom elements, …) is stripped
 * unconditionally, since DOMPurify is configured here as a strict
 * allowlist, not a "block a few dangerous tags" denylist.
 */

/**
 * `data-align`/`class` carry the editor's own image-alignment feature
 * (see RichTextEditor.tsx's `AlignableImage` extension) — not a general
 * escape hatch for arbitrary classes, but DOMPurify has no way to
 * restrict *values*, only attribute *names*, so this allows `class`
 * generally the same way the rest of this project already trusts
 * class="..." coming out of Tiptap's own renderer.
 */

/**
 * Strict allowlist sanitization for admin-typed HTML source, before it's
 * ever loaded back into Tiptap or reaches the form's saved value.
 *
 * - Tags/attributes outside the allowlist above are removed entirely
 *   (this alone already removes `<script>`, `<iframe>`, `on*` handler
 *   attributes are stripped by DOMPurify's core sanitizer regardless of
 *   any allowlist, and `style` is never in ALLOWED_ATTR so inline
 *   style-based vectors are removed too).
 * - `href`/`src` are additionally re-validated against this project's
 *   own `isSafeUrl()` — the exact same rule the toolbar's Link/Image
 *   insert popovers already enforce — so a `javascript:`/`data:`/
 *   `vbscript:` URL is stripped even in the (already unlikely, given
 *   DOMPurify's own URI sanitization) case it survived the first pass.
 *
 * Returns `{ html, wasModified }` — `wasModified` is true whenever
 * DOMPurify's own `.removed` tracking shows anything was actually
 * stripped, so the caller can tell the user their content was changed
 * for safety rather than silently rewriting it.
 */
export function sanitizeEditorHtml(rawHtml: string): { html: string; wasModified: boolean } {
  if (!rawHtml.trim()) {
    return { html: "", wasModified: false };
  }

  DOMPurify.removed = [];

  let sanitized = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ["style"],
    KEEP_CONTENT: true,
  });

  let strippedUnsafeUrl = false;
  sanitized = stripUnsafeUrls(sanitized, () => {
    strippedUnsafeUrl = true;
  });

  return {
    html: sanitized,
    wasModified: DOMPurify.removed.length > 0 || strippedUnsafeUrl,
  };
}

/** Second, defense-in-depth pass over `href`/`src` using this project's own `isSafeUrl()` — reused, not reimplemented. */
function stripUnsafeUrls(html: string, onStrip: () => void): string {
  const container = document.createElement("div");
  container.innerHTML = html;

  for (const el of container.querySelectorAll("a[href]")) {
    const href = el.getAttribute("href");
    if (href && !isSafeUrl(href)) {
      el.removeAttribute("href");
      onStrip();
    }
  }

  for (const el of container.querySelectorAll("img[src]")) {
    const src = el.getAttribute("src");
    if (src && !isSafeUrl(src)) {
      el.remove();
      onStrip();
    }
  }

  return container.innerHTML;
}

/**
 * Admin preview dialogs: stored rich text -> HTML that is safe to inject.
 * Browser-only (DOMPurify needs a DOM); during SSR there is no DOM to
 * sanitize with, so nothing is emitted rather than trusting the raw value.
 */
export function toSafeEditorHtml(value: string | null | undefined): string {
  if (typeof window === "undefined") return "";
  return sanitizeEditorHtml(toEditorContent(value)).html;
}
