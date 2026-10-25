import { cache } from "react";
import { sanitizeHtmlServer } from "@/lib/sanitize-html.server";
import { getGlobalTreatmentBySeoUrl, getGlobalTreatments } from "@/services/global-treatment.service";
import { getGlobalTreatmentSections } from "@/services/global-treatment-section.service";
import { getGlobalTreatmentFaqs } from "@/services/global-treatment-faq.service";
import { getGlobalSpecialityBySeoUrl } from "@/services/global-speciality.service";
import { getGlobalSpecialitySections } from "@/services/global-speciality-section.service";
import { getGlobalSpecialityFaqs } from "@/services/global-speciality-faq.service";
import { getTreatments } from "@/services/treatment.service";
import { getSpecialities } from "@/services/speciality.service";
import { getBlogs } from "@/services/blog.service";
import {
  getBlogUrl,
  getGlobalSpecialityUrl,
  getGlobalTreatmentUrl,
  getSpecialityUrl,
  getTreatmentUrl,
} from "@/lib/public/urls";
import { toLocalImageUrl } from "@/lib/public/homepage";
import type { HomepageBlog } from "@/lib/public/homepage";
import { toEditorContent } from "@/lib/rich-text";

/**
 * Public data layer for `/dcg/{seoUrl}` — the city-independent "global"
 * content namespace shared by Global Treatments and Global Specialities.
 *
 * NON-NEGOTIABLE RULE (locked by the approved architecture): this
 * resolver reads ONLY `global_treatments`/`global_specialities` (and
 * their own `global_*_sections`/`global_*_faqs` children) for content —
 * it never joins through, falls back to, or derives content from any
 * city `treatments`/`specialities` row. The ONLY place a city row is
 * touched here is `resolveCityLinks()`, and that's exclusively for
 * "Choose Your City" discovery (a list of links), never content.
 */

export type PublicGlobalFaq = { id: number; title: string; text: string };

export type PublicGlobalSection = {
  id: number;
  title: string;
  contentHtml: string;
  imageUrl: string | null;
};

export type PublicGlobalCityLink = {
  cityName: string;
  citySeoUrl: string;
  href: string;
};

/** A global treatment's parent global speciality, for the breadcrumb (it no longer affects the treatment's own URL) — present only when the treatment has an explicit, active `global_speciality_id` link. Never set for a `kind: "speciality"` detail (a speciality is never itself nested under another). */
export type PublicGlobalParentSpeciality = {
  name: string;
  seoUrl: string;
  href: string;
};

/** A global speciality's own linked global treatments — the reverse of `PublicGlobalParentSpeciality`, shown as "Related Treatments" on a `kind: "speciality"` detail page. Always empty for a `kind: "treatment"` detail. */
export type PublicGlobalChildTreatment = {
  name: string;
  href: string;
};

export type PublicGlobalContentDetail = {
  kind: "treatment" | "speciality";
  id: number;
  name: string;
  seoUrl: string;
  /** The canonical public URL for this entity — `/dcg/{specialitySeoUrl}/{seoUrl}` for a treatment with an active `parentSpeciality` link, `/dcg/{seoUrl}` otherwise (always true for a speciality). */
  href: string;
  shortDescription: string | null;
  /** Rich HTML from the admin's Tiptap editor — same `.rte-content` convention as every other admin-authored HTML field on this site. Empty string when there's no description. */
  descriptionHtml: string;
  imageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  sections: PublicGlobalSection[];
  faqs: PublicGlobalFaq[];
  /** Other cities that have an active city row explicitly linked to this global entity (via `global_treatment_id`/`global_speciality_id`) — a real FK-driven list, never name-matched, never hardcoded. */
  cities: PublicGlobalCityLink[];
  /**
   * Related Reading — active Blogs EXPLICITLY associated with this exact
   * global treatment/speciality via `blog_global_treatment_mappings`/
   * `blog_global_speciality_mappings` (never by category, city, or
   * keyword matching — see those models' own doc comments). `blogs` is
   * still nationwide (`city_id` is irrelevant here; a blog's own city
   * never gates whether it can be Related Reading for a global entity),
   * but no longer unfiltered — only blogs an admin actually linked to
   * THIS entity appear. Empty when nothing has been linked yet.
   */
  blogs: HomepageBlog[];
  /** `kind: "treatment"` only — `null` when this treatment has no (or an inactive) `global_speciality_id` link. */
  parentSpeciality: PublicGlobalParentSpeciality | null;
  /** `kind: "speciality"` only — always `[]` for a treatment. Active `global_treatments` rows whose `global_speciality_id` explicitly points at this speciality. */
  relatedTreatments: PublicGlobalChildTreatment[];
};

/** Lookup for the canonical `/dcg/speciality/{slug}` and `/dcg/treatment/{slug}` routes. */
export type GlobalContentLookupResult = { status: "not-found" } | { status: "ok"; detail: PublicGlobalContentDetail };

/** Lookup for the LEGACY `/dcg/{slug}` and `/dcg/{speciality}/{treatment}` routes, which only ever redirect. */
export type LegacyGlobalUrlResult = { status: "not-found" } | { status: "redirect"; href: string };

async function resolveTreatmentCityLinks(globalTreatmentId: number): Promise<PublicGlobalCityLink[]> {
  const rows = await getTreatments({ global_treatment_id: globalTreatmentId, status: "active" });

  const seenCityIds = new Set<number>();
  const links: PublicGlobalCityLink[] = [];

  for (const row of rows) {
    if (seenCityIds.has(row.city.id)) continue;
    seenCityIds.add(row.city.id);
    links.push({
      cityName: row.city.city_name,
      citySeoUrl: row.city.seo_url,
      href: getTreatmentUrl(row.city.seo_url, row.seo_url),
    });
  }

  return links;
}

async function resolveSpecialityCityLinks(globalSpecialityId: number): Promise<PublicGlobalCityLink[]> {
  const rows = await getSpecialities({ global_speciality_id: globalSpecialityId, status: "active" });

  const seenCityIds = new Set<number>();
  const links: PublicGlobalCityLink[] = [];

  for (const row of rows) {
    if (seenCityIds.has(row.city.id)) continue;
    seenCityIds.add(row.city.id);
    links.push({
      cityName: row.city.city_name,
      citySeoUrl: row.city.seo_url,
      href: getSpecialityUrl(row.city.seo_url, row.seo_url),
    });
  }

  return links;
}

const GLOBAL_BLOGS_LIMIT = 3;

/** Same mapping every other `lib/public/*.ts` resolver keeps its own independent copy of (see `lib/public/treatments.ts`/`specialities.ts`'s own `toTreatmentBlogCard`/`toSpecialityBlogCard`) — `lib/public/blogs.ts` is locked, so this is not imported from there. */
function toGlobalBlogCard(row: Awaited<ReturnType<typeof getBlogs>>[number]): HomepageBlog {
  return {
    id: row.id,
    title: row.blog_title,
    excerpt: row.meta_description?.trim() || null,
    imageUrl: toLocalImageUrl(row.blog_image),
    publishedDate: row.published_date,
    href: getBlogUrl(row.seo_url),
    categoryName: row.category?.category_name ?? null,
    authorName: row.author_name?.trim() || null,
    authorImageUrl: toLocalImageUrl(row.author_image),
  };
}

/** Related Reading — active blogs explicitly mapped to THIS global treatment/speciality, never an unfiltered/nationwide list. See `blogs` field's own doc comment above. */
async function resolveGlobalBlogs(
  target: { kind: "treatment"; id: number } | { kind: "speciality"; id: number }
): Promise<HomepageBlog[]> {
  const rows = await getBlogs({
    blog_status: "active",
    ...(target.kind === "speciality"
      ? { related_global_speciality_id: target.id }
      : { related_global_treatment_id: target.id }),
  });
  return rows.slice(0, GLOBAL_BLOGS_LIMIT).map(toGlobalBlogCard);
}

/**
 * A global treatment's `global_specialities` join is "active" only when
 * the linked speciality row itself is active — an admin picking an
 * inactive speciality (or one later deactivated) must not produce a
 * nested URL/breadcrumb pointing at a page that 404s. Same "active-only"
 * rule every other global lookup in this file already enforces.
 */
function toParentSpeciality(
  globalTreatment: Awaited<ReturnType<typeof getGlobalTreatmentBySeoUrl>>
): PublicGlobalParentSpeciality | null {
  const speciality = globalTreatment?.global_specialities;
  if (!speciality || speciality.status !== "active") return null;

  return {
    name: speciality.speciality_title?.trim() || speciality.speciality_name,
    seoUrl: speciality.seo_url,
    href: getGlobalSpecialityUrl(speciality.seo_url),
  };
}

/**
 * Shared by both `resolvePublicGlobalContent` (the flat `/dcg/{seoUrl}`
 * route, for a treatment with no — or an inactive — speciality link) and
 * `resolvePublicGlobalTreatmentBySpeciality` (the nested route) — one
 * single place builds a treatment's `PublicGlobalContentDetail`, so the
 * two routes can never drift apart on what a treatment detail actually
 * contains.
 */
async function buildGlobalTreatmentDetail(
  globalTreatment: NonNullable<Awaited<ReturnType<typeof getGlobalTreatmentBySeoUrl>>>
): Promise<PublicGlobalContentDetail> {
  const [sectionRows, faqRows, cities, blogs] = await Promise.all([
    getGlobalTreatmentSections(globalTreatment.id),
    getGlobalTreatmentFaqs({ global_treatment_id: globalTreatment.id, status: "active" }),
    resolveTreatmentCityLinks(globalTreatment.id),
    resolveGlobalBlogs({ kind: "treatment", id: globalTreatment.id }),
  ]);

  const sections: PublicGlobalSection[] = sectionRows
    .filter((section) => section.status === "active")
    .map((section) => ({
      id: section.id,
      title: section.title,
      contentHtml: sanitizeHtmlServer(toEditorContent(section.content)),
      imageUrl: toLocalImageUrl(section.image),
    }));

  const parentSpeciality = toParentSpeciality(globalTreatment);

  return {
    kind: "treatment",
    id: globalTreatment.id,
    name: globalTreatment.treatment_title?.trim() || globalTreatment.treatment_name,
    seoUrl: globalTreatment.seo_url,
    href: getGlobalTreatmentUrl(globalTreatment.seo_url),
    shortDescription: globalTreatment.short_description?.trim() || null,
    descriptionHtml: sanitizeHtmlServer(toEditorContent(globalTreatment.description)),
    imageUrl: toLocalImageUrl(globalTreatment.image),
    metaTitle: globalTreatment.meta_title?.trim() || null,
    metaDescription: globalTreatment.meta_description?.trim() || null,
    sections,
    faqs: faqRows.map((faq) => ({ id: faq.id, title: faq.title, text: faq.text })),
    cities,
    blogs,
    parentSpeciality,
    relatedTreatments: [],
  };
}

/** One place builds a speciality's `PublicGlobalContentDetail`, mirroring `buildGlobalTreatmentDetail`. */
async function buildGlobalSpecialityDetail(
  globalSpeciality: NonNullable<Awaited<ReturnType<typeof getGlobalSpecialityBySeoUrl>>>
): Promise<PublicGlobalContentDetail> {
  const [sectionRows, faqRows, cities, blogs, relatedTreatmentRows] = await Promise.all([
    getGlobalSpecialitySections(globalSpeciality.id),
    getGlobalSpecialityFaqs({ global_speciality_id: globalSpeciality.id, status: "active" }),
    resolveSpecialityCityLinks(globalSpeciality.id),
    resolveGlobalBlogs({ kind: "speciality", id: globalSpeciality.id }),
    getGlobalTreatments({ global_speciality_id: globalSpeciality.id, status: "active" }),
  ]);

  const sections: PublicGlobalSection[] = sectionRows
    .filter((section) => section.status === "active")
    .map((section) => ({
      id: section.id,
      title: section.title,
      contentHtml: sanitizeHtmlServer(toEditorContent(section.content)),
      imageUrl: toLocalImageUrl(section.image),
    }));

  const relatedTreatments: PublicGlobalChildTreatment[] = relatedTreatmentRows.map((treatment) => ({
    name: treatment.treatment_title?.trim() || treatment.treatment_name,
    href: getGlobalTreatmentUrl(treatment.seo_url),
  }));

  return {
    kind: "speciality",
    id: globalSpeciality.id,
    name: globalSpeciality.speciality_title?.trim() || globalSpeciality.speciality_name,
    seoUrl: globalSpeciality.seo_url,
    href: getGlobalSpecialityUrl(globalSpeciality.seo_url),
    shortDescription: globalSpeciality.short_description?.trim() || null,
    descriptionHtml: sanitizeHtmlServer(toEditorContent(globalSpeciality.description)),
    imageUrl: toLocalImageUrl(globalSpeciality.image),
    metaTitle: globalSpeciality.meta_title?.trim() || null,
    metaDescription: globalSpeciality.meta_description?.trim() || null,
    sections,
    faqs: faqRows.map((faq) => ({ id: faq.id, title: faq.title, text: faq.text })),
    cities,
    blogs,
    parentSpeciality: null,
    relatedTreatments,
  };
}

/** `/dcg/speciality/{seoUrl}` — an active global speciality by its own slug, else not-found. */
export async function resolvePublicGlobalSpeciality(seoUrl: string): Promise<GlobalContentLookupResult> {
  const globalSpeciality = await getGlobalSpecialityBySeoUrl(seoUrl);
  if (!globalSpeciality) return { status: "not-found" };
  return { status: "ok", detail: await buildGlobalSpecialityDetail(globalSpeciality) };
}

/** `/dcg/treatment/{seoUrl}` — an active global treatment by its own slug alone (its speciality link is optional), else not-found. */
export async function resolvePublicGlobalTreatment(seoUrl: string): Promise<GlobalContentLookupResult> {
  const globalTreatment = await getGlobalTreatmentBySeoUrl(seoUrl);
  if (!globalTreatment) return { status: "not-found" };
  return { status: "ok", detail: await buildGlobalTreatmentDetail(globalTreatment) };
}

export const getCachedPublicGlobalSpeciality = cache((seoUrl: string) => resolvePublicGlobalSpeciality(seoUrl));
export const getCachedPublicGlobalTreatment = cache((seoUrl: string) => resolvePublicGlobalTreatment(seoUrl));

/**
 * Legacy flat `/dcg/{seoUrl}`: decides, from the database, whether the slug
 * is a global speciality or a global treatment and returns the new
 * canonical URL. If, somehow, both tables hold the same slug (write-time
 * validation prevents it — see `GlobalSeoUrlCollisionError`; this is a
 * defensive guard against manual DB edits) it logs and returns not-found
 * rather than arbitrarily picking one. The destination always lives under
 * `/dcg/speciality/` or `/dcg/treatment/`, so this can never redirect to
 * itself.
 */
export async function resolveLegacyGlobalUrl(seoUrl: string): Promise<LegacyGlobalUrlResult> {
  const [globalTreatment, globalSpeciality] = await Promise.all([
    getGlobalTreatmentBySeoUrl(seoUrl),
    getGlobalSpecialityBySeoUrl(seoUrl),
  ]);

  if (globalTreatment && globalSpeciality) {
    console.error(
      `Data integrity conflict: seo_url "${seoUrl}" matches both a global treatment (id ${globalTreatment.id}) and a global speciality (id ${globalSpeciality.id}). Refusing to arbitrarily pick one.`
    );
    return { status: "not-found" };
  }

  if (globalSpeciality) return { status: "redirect", href: getGlobalSpecialityUrl(globalSpeciality.seo_url) };
  if (globalTreatment) return { status: "redirect", href: getGlobalTreatmentUrl(globalTreatment.seo_url) };
  return { status: "not-found" };
}

/**
 * Legacy nested `/dcg/{specialitySeoUrl}/{treatmentSeoUrl}`: redirects to the
 * treatment's new URL only when the old combination was actually valid (the
 * treatment really is linked to that speciality) — an invalid or mismatched
 * pair stays a 404 exactly as before, never a redirect to a page the old URL
 * never pointed at.
 */
export async function resolveLegacyNestedGlobalTreatmentUrl(
  specialitySeoUrl: string,
  treatmentSeoUrl: string
): Promise<LegacyGlobalUrlResult> {
  const [globalSpeciality, globalTreatment] = await Promise.all([
    getGlobalSpecialityBySeoUrl(specialitySeoUrl),
    getGlobalTreatmentBySeoUrl(treatmentSeoUrl),
  ]);

  if (!globalSpeciality || !globalTreatment || globalTreatment.global_speciality_id !== globalSpeciality.id) {
    return { status: "not-found" };
  }

  return { status: "redirect", href: getGlobalTreatmentUrl(globalTreatment.seo_url) };
}
