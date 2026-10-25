/**
 * Server-side SVG sanitization for uploaded custom homepage icons.
 *
 * Deliberately a SEPARATE module from `lib/sanitize-html.ts`: that one
 * wraps the browser-global `DOMPurify` import, which requires a real
 * `window`/`document` and only runs client-side (its own doc comment
 * says importing it from a server module would throw at import time).
 * File uploads are processed server-side (the API route/controller,
 * Node.js runtime), so this module constructs its own sandboxed DOM via
 * `jsdom` and creates a dedicated `DOMPurify` instance bound to it —
 * the same underlying, already-vetted sanitizer engine this project
 * already depends on, just given a server-safe DOM to run inside.
 *
 * The allowlist here is intentionally narrower than (and different
 * from) `sanitize-html.ts`'s rich-text allowlist — SVG has its own tag
 * vocabulary, and an icon is presentational vector shape data, never
 * rich text. `<image>`/`<foreignObject>` (which could embed another
 * raster image or arbitrary HTML/SVG) are deliberately NOT allowed —
 * this sanitizer is for simple vector icon shapes only, matching what a
 * real icon exported from a design tool (Figma, Freepik, etc.) contains.
 */
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window as unknown as Window & typeof globalThis);

const ALLOWED_TAGS = [
  "svg",
  "g",
  "path",
  "circle",
  "ellipse",
  "rect",
  "line",
  "polyline",
  "polygon",
  "defs",
  "clipPath",
  "mask",
  "linearGradient",
  "radialGradient",
  "stop",
  "title",
  "desc",
  "symbol",
  "use",
];

const ALLOWED_ATTR = [
  "xmlns",
  "viewBox",
  "width",
  "height",
  "d",
  "fill",
  "fill-rule",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-dasharray",
  "stroke-opacity",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "points",
  "offset",
  "stop-color",
  "stop-opacity",
  "gradientUnits",
  "gradientTransform",
  "transform",
  "opacity",
  "clip-rule",
  "clip-path",
  "mask",
  "id",
  "href",
];

export class InvalidSvgError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSvgError";
  }
}

/**
 * Sanitizes raw SVG source text (already decoded from the uploaded
 * file's bytes as UTF-8). Strips `<script>`, event-handler attributes
 * (`onload`, `onclick`, …), `<style>` (a CSS-injection vector DOMPurify
 * would otherwise keep), `<foreignObject>`/`<image>` (could embed
 * arbitrary HTML or another raster payload), and any `xlink:href`/`href`
 * value DOMPurify's own URI sanitization flags as unsafe (so `href`
 * stays allowed for legitimate same-document `#id` gradient/clip-path
 * references — the only pattern real icon exports use it for — while
 * `javascript:`/external URLs are removed). Throws `InvalidSvgError`
 * when the input isn't parseable as SVG at all (empty after
 * sanitization, or has no root `<svg>` element) rather than silently
 * storing an empty/broken icon.
 */
export function sanitizeSvg(rawSvg: string): { svg: string; wasModified: boolean } {
  DOMPurify.removed = [];

  const sanitized = DOMPurify.sanitize(rawSvg, {
    USE_PROFILES: { svg: true, svgFilters: false },
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS: ["script", "style", "foreignObject", "image", "animate", "animateTransform", "set"],
    FORBID_ATTR: ["style", "onload", "onerror", "onclick"],
    ALLOW_DATA_ATTR: false,
    RETURN_DOM_FRAGMENT: false,
  });

  const trimmed = sanitized.trim();

  if (!trimmed || !/^<svg[\s>]/i.test(trimmed)) {
    throw new InvalidSvgError("The uploaded file is not a valid SVG icon.");
  }

  // jsdom's HTML parser repairs genuinely malformed/garbage markup (unclosed
  // tags, stray text) into a syntactically valid but contentless `<svg></svg>`
  // rather than failing to parse it — that still passes the check above, so
  // reject it explicitly here rather than silently storing an invisible icon.
  const hasDrawableContent = /<(?!svg[\s>]|\/svg>)[a-z][\s\S]*?>/i.test(trimmed);
  if (!hasDrawableContent) {
    throw new InvalidSvgError("The uploaded SVG has no visible icon content.");
  }

  return { svg: trimmed, wasModified: DOMPurify.removed.length > 0 };
}
