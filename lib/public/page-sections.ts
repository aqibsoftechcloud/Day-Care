import { getPageSections } from "@/services/page-section.service";
import { sanitizeHtmlServer } from "@/lib/sanitize-html.server";
import { toLocalImageUrl } from "@/lib/public/homepage";
import { getAllPublicHospitalCards } from "@/lib/public/hospitals";
import type { HomepageHospital } from "@/lib/public/homepage";
import type {
  AboutSectionContent,
  ContentSectionContent,
  CtaSectionContent,
  FeaturesSectionContent,
  HeroSectionContent,
  HospitalListingSectionContent,
} from "@/types/page-section";

/**
 * Public data layer for structured Page Sections — calls the existing
 * `page-section.service.ts` (never Prisma directly) and reshapes each
 * row's typed `content` into a small, public-safe DTO per section type.
 * Image paths go through `toLocalImageUrl` (same helper `homepage.ts`
 * already uses) even though `uploadPageSectionImage` only ever writes a
 * same-origin `/uploads/page-sections/...` path — defensive, matching
 * every other image field's convention in this codebase.
 */

export type PublicHeroSection = {
  type: "hero";
  id: number;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
};

export type PublicAboutSection = {
  type: "about";
  id: number;
  heading: string;
  /** Rich HTML from the shared RichTextEditor — rendered the same way `pages.body` already is (see GenericPageBody.tsx): never sanitized (no sanitizer exists in this project), safe only because it's admin-authored through the schema-constrained editor. */
  content: string;
  imageUrl: string | null;
};

export type PublicFeatureItem = {
  title: string;
  description: string;
  imageUrl: string | null;
};

export type PublicFeaturesSection = {
  type: "features";
  id: number;
  heading: string;
  items: PublicFeatureItem[];
};

export type PublicContentSection = {
  type: "content";
  id: number;
  heading: string;
  content: string;
};

export type PublicCtaSection = {
  type: "cta";
  id: number;
  heading: string;
  description: string | null;
  buttonText: string;
  buttonUrl: string;
};

export type PublicHospitalListingSection = {
  type: "hospital_listing";
  id: number;
  heading: string;
  description: string | null;
  columns: 2 | 3 | 4;
  initialCount: number;
  loadMore: boolean;
  /** Live from Hospital Management — every active hospital, all cities. Empty -> the renderer shows an empty state. */
  hospitals: HomepageHospital[];
};

export type PublicPageSection =
  | PublicHeroSection
  | PublicAboutSection
  | PublicFeaturesSection
  | PublicContentSection
  | PublicCtaSection
  | PublicHospitalListingSection;

/**
 * Active sections for one Page, in their CMS `section_order`
 * (`getPageSections` already orders this way). Inactive sections are
 * dropped entirely — never rendered, never counted toward "does this
 * page have sections" (see GenericPageBody.tsx's fallback-to-`body`
 * check).
 */
export async function getPublicPageSections(pageId: number): Promise<PublicPageSection[]> {
  const rows = await getPageSections(pageId);

  const active = rows.filter((row) => row.status === "active");
  // Only fetched when a page actually has a Hospital Listing section.
  const hospitals = active.some((row) => row.section_type === "hospital_listing") ? await getAllPublicHospitalCards() : [];

  return active.map((row): PublicPageSection => {
      switch (row.section_type) {
        case "hero": {
          const content = row.content as HeroSectionContent;
          return {
            type: "hero",
            id: row.id,
            title: content.title,
            subtitle: content.subtitle?.trim() || null,
            imageUrl: toLocalImageUrl(content.image ?? null),
            ctaText: content.cta_text?.trim() || null,
            ctaUrl: content.cta_url?.trim() || null,
          };
        }
        case "about": {
          const content = row.content as AboutSectionContent;
          return {
            type: "about",
            id: row.id,
            heading: content.heading,
            content: sanitizeHtmlServer(content.content),
            imageUrl: toLocalImageUrl(content.image ?? null),
          };
        }
        case "features": {
          const content = row.content as FeaturesSectionContent;
          return {
            type: "features",
            id: row.id,
            heading: content.heading,
            items: content.items.map((item) => ({
              title: item.title,
              description: item.description?.trim() || "",
              imageUrl: toLocalImageUrl(item.image ?? null),
            })),
          };
        }
        case "content": {
          const content = row.content as ContentSectionContent;
          return {
            type: "content",
            id: row.id,
            heading: content.heading,
            content: content.content,
          };
        }
        case "cta": {
          const content = row.content as CtaSectionContent;
          return {
            type: "cta",
            id: row.id,
            heading: content.heading,
            description: content.description?.trim() || null,
            buttonText: content.button_text,
            buttonUrl: content.button_url,
          };
        }
        case "hospital_listing": {
          const content = row.content as HospitalListingSectionContent;
          return {
            type: "hospital_listing",
            id: row.id,
            heading: content.heading,
            description: content.description?.trim() || null,
            columns: content.columns === 2 || content.columns === 4 ? content.columns : 3,
            initialCount: Number.isInteger(content.initial_count) && content.initial_count > 0 ? content.initial_count : 6,
            loadMore: content.load_more !== false,
            hospitals,
          };
        }
      }
    });
}
