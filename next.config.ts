import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy. A nonce-based `script-src` would be stricter, but
 * Next.js only applies nonces to dynamically rendered pages — it would force
 * every public page off static/ISR caching — so `script-src` keeps
 * `'unsafe-inline'` (Next's inline bootstrap/flight scripts) and the
 * primary XSS defence is server-side HTML sanitization (lib/sanitize-html.server.ts).
 * Everything else is locked down: no plugins, no <base> hijack, forms post
 * only to this origin, nothing can frame the site, only YouTube may be framed,
 * and XHR/fetch is same-origin only. `'unsafe-eval'` is dev-only (React debugging).
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // HSTS is sent only when the deployment is HTTPS-only (set ENABLE_HSTS=true) — on plain HTTP it is ignored at best, and a mistake locks browsers out.
  ...(process.env.ENABLE_HSTS === "true" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  serverExternalPackages: ["@prisma/client"],
  images: {
    // Custom homepage icons may be uploaded as SVG. next/image refuses to
    // serve SVGs by default (they could carry an XSS payload) — safe to
    // enable here because every SVG actually reaches disk only after
    // `lib/sanitize-svg.ts`'s strict allowlist sanitization at upload
    // time; nothing unsanitized is ever stored. `contentDispositionType`
    // + `contentSecurityPolicy` are Next.js's own documented pairing for
    // this flag — defense in depth if an SVG is ever opened directly
    // rather than rendered inside an <img>/<Image>.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async redirects() {
    return [
      // The global content namespace moved from /c/{seoUrl} to
      // /dcg/{seoUrl} (see lib/public/urls.ts's getGlobalContentUrl).
      // Permanent (308) so old links/bookmarks/search results keep
      // working and search engines transfer ranking to the new URL.
      // Query strings are preserved automatically by Next.js redirects
      // when the destination doesn't already define its own; this can
      // never loop since the destination path ("/dcg/...") is disjoint
      // from the source ("/c/...").
      {
        source: "/c/:seoUrl",
        destination: "/dcg/:seoUrl",
        permanent: true,
      },
      // /book-appointment was superseded by the single global /contact-us
      // page (same shared consultation form). Permanent (308); the
      // ?city=/?treatment= preselection params carry over automatically
      // because this destination defines no query string of its own.
      {
        source: "/book-appointment",
        destination: "/contact-us",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
