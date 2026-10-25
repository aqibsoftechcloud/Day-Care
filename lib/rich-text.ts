/**
 * Shared helpers for the admin CMS's rich-text `body`/`description` fields
 * (Pages, Doctor Pages). These fields are `String? @db.LongText` in the
 * database with no format constraint — the API/validator accept any
 * string. Tiptap's `getHTML()` output is just another valid string for
 * that same column, so no backend change is needed to store it.
 */

// Tiptap's getHTML() always wraps its content in one of these block-level
// tags starting at position zero. Checking for that specific shape (rather
// than "contains anything that looks like a tag anywhere") avoids
// misclassifying legacy plain text that merely happens to contain a
// bracketed word (e.g. "<please see attached>") as already being HTML.
const TIPTAP_BLOCK_START_PATTERN = /^<(p|h[1-4]|ul|ol|blockquote|hr|table|img)[\s/>]/i;

/** True if the stored value already looks like editor-produced HTML, false if it looks like legacy plain text (authored via the old plain `Textarea`). */
export function looksLikeHtml(value: string): boolean {
  return TIPTAP_BLOCK_START_PATTERN.test(value.trim());
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Converts legacy plain-text content (saved before this editor existed)
 * into equivalent, safe HTML — blank lines become paragraph breaks, single
 * newlines become line breaks — so existing Page/Doctor Page content
 * loads into the editor with its structure intact instead of collapsing
 * into one run-on paragraph or being lost.
 */
export function plainTextToHtml(value: string): string {
  const paragraphs = value.split(/\n{2,}/);
  return paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Prepares a stored `body`/`description` value for the editor's initial content — passes real HTML through unchanged, upgrades legacy plain text. */
export function toEditorContent(value: string | null | undefined): string {
  if (!value) return "";
  return looksLikeHtml(value) ? value : plainTextToHtml(value);
}

/**
 * A handful of Tiptap's own "empty document" shapes — an editor with no
 * real content still produces one of these, not an empty string. Treated
 * as empty so the form submits `null`/omits the field instead of a
 * meaningless `<p></p>`, matching what the existing optional-field
 * validators expect for "no content".
 */
const EMPTY_HTML_VALUES = new Set(["", "<p></p>", "<p><br></p>"]);

export function isEmptyEditorHtml(html: string): boolean {
  return EMPTY_HTML_VALUES.has(html.trim());
}

const UNSAFE_URL_SCHEME = /^\s*(javascript|data|vbscript):/i;

/**
 * Guards the Link/Image "insert by URL" flows against script-executing
 * schemes. Allows normal absolute URLs, protocol-relative URLs, root/relative
 * paths, and `mailto:`/`tel:` — rejects anything using `javascript:`,
 * `data:`, or `vbscript:`, which is the actual XSS vector for a
 * user-supplied URL in a link or image `src`.
 */
export function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (UNSAFE_URL_SCHEME.test(trimmed)) return false;
  return true;
}
