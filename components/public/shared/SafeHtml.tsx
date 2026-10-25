import { sanitizeHtmlServer } from "@/lib/sanitize-html.server";

/**
 * The only way public pages inject CMS rich text. Sanitizes with the
 * server allowlist on every render, so even HTML stored before sanitization
 * existed (or written straight through the API) cannot run script.
 */
export function SafeHtml({ html, className }: { html: string | null | undefined; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeHtmlServer(html) }} />;
}
