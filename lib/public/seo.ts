import type { Metadata } from "next";

/**
 * Resolves the site's absolute base URL for building canonical/Open Graph
 * URLs. Reads `NEXT_PUBLIC_SITE_URL` if it has been configured — that
 * decision (which domain the public site launches on) hasn't been made
 * yet, so this deliberately does not invent or hardcode one. Returns ""
 * when unset, which callers below treat as "no base URL yet" and fall
 * back to a plain relative path rather than guessing a domain.
 */
export function getPublicSiteBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "";
  return raw.replace(/\/+$/, "");
}

/** Builds an absolute URL for `path` (must start with "/") using the configured base URL, or returns `path` unchanged if no base URL is configured yet. */
export function buildCanonicalUrl(path: string): string {
  const base = getPublicSiteBaseUrl();
  return base ? `${base}${path}` : path;
}

export type PublicMetadataInput = {
  /** Page `<title>` — supplied by the caller per page; no copy is invented here. */
  title: string;
  description?: string;
  /** The page's own canonical relative path, e.g. from a `lib/public/urls.ts` helper. */
  canonicalPath: string;
  keywords?: string[];
  /** Absolute or root-relative image URL for Open Graph/Twitter previews. */
  imageUrl?: string;
};

/**
 * Generic `Metadata` builder shared by every public page — title,
 * description, canonical, and Open Graph/Twitter defaults derived from
 * the same inputs, so each page only ever supplies its own content once.
 * Contains no page-specific copy and is not wired into any route yet.
 */
export function buildPublicMetadata(input: PublicMetadataInput): Metadata {
  const canonical = buildCanonicalUrl(input.canonicalPath);
  const images = input.imageUrl ? [input.imageUrl] : undefined;

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      images: images?.map((url) => ({ url })),
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: input.title,
      description: input.description,
      images,
    },
  };
}
