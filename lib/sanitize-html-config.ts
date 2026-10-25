/**
 * The rich-text allowlist shared by the browser sanitizer
 * (lib/sanitize-html.ts, editor HTML-source mode) and the server sanitizer
 * (lib/sanitize-html.server.ts, save + render). Pure data — no DOM.
 *
 * Covers what Tiptap's schema (StarterKit + TextAlign + Image + TableKit)
 * produces. Everything else (script, style, iframe, object, embed, form,
 * svg, math, link, meta, base, …) is dropped; `style` and every `on*`
 * attribute are never allowed.
 */
export const ALLOWED_TAGS = [
  "p",
  "div",
  "span",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "sub",
  "sup",
  "code",
  "pre",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "img",
  "br",
  "hr",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "colgroup",
  "col",
  "caption",
];

export const ALLOWED_ATTR = ["href", "src", "alt", "title", "target", "rel", "class", "colspan", "rowspan", "data-align", "data-colwidth"];

/** `javascript:`, `data:` and `vbscript:` URLs (leading whitespace/control chars tolerated) — same rule as lib/rich-text.ts's isSafeUrl. */
export function isUnsafeUrl(url: string): boolean {
  const compact = url.replace(/[\u0000-  ]+/g, "");
  return compact === "" || /^(javascript|data|vbscript):/i.test(compact);
}
