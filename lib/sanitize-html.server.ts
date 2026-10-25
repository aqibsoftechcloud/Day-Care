/**
 * Server-side HTML sanitizer for CMS rich text. The browser sanitizer
 * (lib/sanitize-html.ts) only protects the editor's HTML-source box; API
 * callers can bypass the editor entirely, so the server must not trust any
 * stored HTML. Runs DOMPurify inside a jsdom window (same pairing as
 * lib/sanitize-svg.ts) with the strict allowlist from sanitize-html-config.ts.
 *
 * Used (a) when saving page body / blog_text / doctor doc_info, and (b) at
 * render time on every public page and admin preview, which also neutralises
 * content stored before this existed.
 */
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";
import { ALLOWED_ATTR, ALLOWED_TAGS, isUnsafeUrl } from "./sanitize-html-config";

const purifier = createDOMPurify(new JSDOM("").window as unknown as Window & typeof globalThis);

purifier.addHook("afterSanitizeAttributes", (node) => {
  const el = node as Element;

  if (el.hasAttribute("href") && isUnsafeUrl(el.getAttribute("href") ?? "")) {
    el.removeAttribute("href");
  }

  if (el.tagName === "IMG" && isUnsafeUrl(el.getAttribute("src") ?? "")) {
    el.remove();
    return;
  }

  if (el.tagName === "A" && el.getAttribute("target")) {
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
  }
});

export function sanitizeHtmlServer(html: string | null | undefined): string {
  if (!html) return "";

  return purifier.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ["style"],
    KEEP_CONTENT: true,
    ALLOW_ARIA_ATTR: false,
  });
}

/** For write paths: leaves `undefined`/`null` alone (partial updates, cleared fields), sanitizes any string. */
export function sanitizeOptionalHtml<T extends string | null | undefined>(value: T): T {
  return (typeof value === "string" ? sanitizeHtmlServer(value) : value) as T;
}

/** Sanitizes the named string fields of a write payload (rich-text columns); other keys, `null` and `undefined` are left untouched. */
export function sanitizeHtmlFields<T extends object>(data: T, keys: readonly string[]): T {
  const copy: Record<string, unknown> = { ...(data as Record<string, unknown>) };

  for (const key of keys) {
    if (typeof copy[key] === "string") {
      copy[key] = sanitizeHtmlServer(copy[key] as string);
    }
  }

  return copy as T;
}

/**
 * Section tables keep their JSON `content`; the rich-text Content editor's HTML lives at `content.content`
 * (about / content / custom sections). Only that string is sanitized; titles, image paths, etc. stay as-is.
 */
export function sanitizeSectionPayload<T extends { content?: unknown }>(data: T): T {
  const content = data.content;

  if (typeof content !== "object" || content === null || Array.isArray(content) || typeof (content as Record<string, unknown>).content !== "string") {
    return data;
  }

  return { ...data, content: { ...content, content: sanitizeHtmlServer((content as Record<string, string>).content) } };
}
