import type { FooterLink } from "@/components/public/layout/FooterColumn";
import type { PublicMenuItem } from "@/lib/public/menu-tree";
import { splitByPlacement } from "@/lib/public/menu-tree";
import { getContactUsUrl } from "@/lib/public/urls";
import { isLegalPage, type PublicPage } from "@/lib/public/pages";

export type PublicNavLinkGroups = {
  explore: FooterLink[];
  patients: FooterLink[];
  /** Admin "Company" pages + any CMS menu item placed in the footer region. Empty when neither exists yet — callers should hide the section rather than render an empty heading. */
  company: FooterLink[];
  legal: FooterLink[];
};

/**
 * Shared "Explore"/"Patients"/"Company"/legal link groups — originally
 * `PublicFooter.tsx`'s own private `buildAnchorLinks()` + inline
 * company/legal computation, extracted here so `PublicMobileMenu.tsx`
 * (the mobile nav drawer) can reuse the exact same real, already-
 * established anchor/CMS/Pages data instead of duplicating it, per
 * `PublicFooter.tsx`'s own doc comment on why these are in-page anchors
 * into homepage sections, not dedicated routes (every one of those
 * routes 404s today).
 */
export function buildPublicNavLinkGroups(
  homeHref: string,
  menuTree: PublicMenuItem[],
  pages: PublicPage[]
): PublicNavLinkGroups {
  const explore: FooterLink[] = [
    { label: "Specialities & Treatments", href: `${homeHref}#specialized-care-heading` },
    { label: "Hospitals", href: `${homeHref}#hospitals-heading` },
    { label: "Doctors", href: `${homeHref}#doctors-heading` },
  ];

  const patients: FooterLink[] = [
    { label: "Book an Appointment", href: getContactUsUrl() },
    { label: "Patient Reviews", href: `${homeHref}#reviews-heading` },
    { label: "FAQs", href: `${homeHref}#faq-heading` },
    { label: "Blogs", href: `${homeHref}#blogs-heading` },
  ];

  const cmsFooterMenuLinks: FooterLink[] = splitByPlacement(menuTree)
    .footer.flatMap((item) => [item, ...item.children])
    .filter((item): item is typeof item & { href: string } => item.href !== null)
    .map((item) => ({ label: item.label, href: item.href }));

  const legalPages = pages.filter(isLegalPage);
  // "hidden" pages are excluded from both lists.
  const companyPages = pages.filter((page) => page.footerPlacement === "company");

  const companyLinksByHref = new Map<string, FooterLink>();
  for (const link of [...cmsFooterMenuLinks, ...companyPages.map((page) => ({ label: page.title, href: page.href }))]) {
    companyLinksByHref.set(link.href, link);
  }

  return {
    explore,
    patients,
    company: Array.from(companyLinksByHref.values()),
    legal: legalPages.map((page) => ({ label: page.title, href: page.href })),
  };
}
