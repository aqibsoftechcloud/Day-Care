import { getFooterSettings } from "@/services/footer-settings.service";
import { splitByPlacement, type PublicMenuItem } from "@/lib/public/menu-tree";
import type { PublicCity } from "@/lib/public/cities";
import type { PublicPage } from "@/lib/public/pages";
import {
  DEFAULT_FOOTER_SETTINGS,
  FOOTER_CONTACT_TOKEN,
  FOOTER_HOME_TOKEN,
  type FooterSettings,
} from "@/types/footer-settings";
import type { FooterLink } from "@/components/public/layout/FooterColumn";

/**
 * The saved footer, read strictly. If it can't be read (DB error or an
 * invalid stored block) the footer must not take every public page down with
 * it, so this logs the real error and renders the built-in default footer
 * (the original one) — the only place a footer falls back, and never silent.
 */
export async function getPublicFooterSettings(): Promise<FooterSettings> {
  try {
    return await getFooterSettings({ strict: true });
  } catch (error) {
    console.error("Failed to load the footer settings, rendering the default footer:", error);
    return JSON.parse(JSON.stringify(DEFAULT_FOOTER_SETTINGS)) as FooterSettings;
  }
}

export type FooterLinkContext = {
  /** `/` on global routes, the current city's home on city routes. */
  homeHref: string;
  /** The Contact Us URL, already carrying the current city. */
  contactHref: string;
};

/** Resolves `{home}` / `{contact}` (optionally followed by #anchor or ?query); every other href is used as saved. */
export function resolveFooterHref(href: string, context: FooterLinkContext): string {
  if (href.startsWith(FOOTER_HOME_TOKEN)) return `${context.homeHref}${href.slice(FOOTER_HOME_TOKEN.length)}`;
  if (href.startsWith(FOOTER_CONTACT_TOKEN)) {
    const rest = href.slice(FOOTER_CONTACT_TOKEN.length);
    // Anchors/queries after {contact} are appended to the Contact URL.
    if (rest.startsWith("?") && context.contactHref.includes("?")) return `${context.contactHref}&${rest.slice(1)}`;
    return `${context.contactHref}${rest}`;
  }
  return href;
}

export type ResolvedFooterColumn = { title: string; links: FooterLink[] };

function dedupe(links: FooterLink[]): FooterLink[] {
  const seen = new Map<string, FooterLink>();
  for (const link of links) if (!seen.has(link.href)) seen.set(link.href, link);
  return Array.from(seen.values());
}

/**
 * Builds the visible columns from the saved configuration: manual links
 * first, then each enabled automatic source (Footer-region menu items,
 * company-placed CMS pages, active cities). A column with no resulting
 * links is dropped rather than rendered as an empty heading — exactly as
 * the old hardcoded "Company" column behaved.
 */
export function resolveFooterColumns(
  settings: FooterSettings,
  context: FooterLinkContext & { cities: PublicCity[]; pages: PublicPage[]; menuTree: PublicMenuItem[] }
): ResolvedFooterColumn[] {
  const footerMenuLinks: FooterLink[] = splitByPlacement(context.menuTree)
    .footer.flatMap((item) => [item, ...item.children])
    .filter((item): item is typeof item & { href: string } => item.href !== null)
    .map((item) => ({ label: item.label, href: item.href }));
  const pageLinks: FooterLink[] = context.pages
    .filter((page) => page.footerPlacement === "company")
    .map((page) => ({ label: page.title, href: page.href }));
  const cityLinks: FooterLink[] = context.cities.map((city) => ({ label: city.name, href: city.href }));

  return settings.columns
    .filter((column) => column.enabled)
    .map((column) => ({
      title: column.title,
      links: dedupe([
        ...column.links.map((link) => ({ label: link.label, href: resolveFooterHref(link.href, context) })),
        ...(column.include.includes("footer_menu") ? footerMenuLinks : []),
        ...(column.include.includes("pages") ? pageLinks : []),
        ...(column.include.includes("cities") ? cityLinks : []),
      ]),
    }))
    .filter((column) => column.links.length > 0);
}
