import type { ContactItem } from "@/types/contact-page-settings";

/**
 * Link tokens a footer link's `href` may start with. They are resolved when
 * the footer renders, so one saved link works on the global site AND on every
 * city: `{home}` -> `/` or the current city's home, `{contact}` -> the Contact
 * Us page (carrying the current city, like every other appointment CTA).
 */
export const FOOTER_HOME_TOKEN = "{home}";
export const FOOTER_CONTACT_TOKEN = "{contact}";

/** Automatic link sources a column can add after its own manual links. */
export const FOOTER_INCLUDE_SOURCES = ["footer_menu", "pages", "cities"] as const;
export type FooterIncludeSource = (typeof FOOTER_INCLUDE_SOURCES)[number];

export const FOOTER_INCLUDE_LABELS: Record<FooterIncludeSource, string> = {
  footer_menu: "Menu items placed in the Footer region (Menu Management)",
  pages: "CMS pages marked \"Company links\" (Content Management → Pages)",
  cities: "Active cities",
};

export type FooterLinkItem = { label: string; href: string };

export type FooterColumnConfig = {
  title: string;
  enabled: boolean;
  /** Manual links, shown first. */
  links: FooterLinkItem[];
  /** Automatic sources appended after the manual links (de-duplicated by URL). */
  include: FooterIncludeSource[];
};

export const SOCIAL_PLATFORMS = ["facebook", "instagram", "x", "linkedin", "youtube", "whatsapp"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X (Twitter)",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
};

export type FooterSocialLink = { platform: SocialPlatform; url: string; visible: boolean };

/** Everything editable in Admin → Settings → Footer Settings. Footer colours live in Website Appearance. */
export type FooterSettings = {
  /** First (white) part of the text wordmark, shown when there is no logo image. */
  brand_primary: string;
  /** Second (accent-coloured) part of the text wordmark. */
  brand_accent: string;
  /** Uploaded logo path (`/uploads/footer/...`), or null for the text wordmark. */
  logo: string | null;
  description: string;
  cta_enabled: boolean;
  cta_heading: string;
  cta_description: string;
  cta_button_label: string;
  /** Empty = the Contact Us page (with the current city), exactly like every other appointment CTA. */
  cta_button_url: string;
  /** `{year}` is replaced with the current year. */
  copyright_text: string;
  /** Array order IS the display order. */
  columns: FooterColumnConfig[];
  contact_items: ContactItem[];
  social_links: FooterSocialLink[];
  /** Extra links in the bottom bar, shown after the legal pages. */
  bottom_links: FooterLinkItem[];
};

export const MAX_FOOTER_COLUMNS = 6;
export const MAX_FOOTER_LINKS_PER_COLUMN = 20;

/** The original, previously hardcoded footer — used when nothing has been saved yet, so the site looks identical until an admin changes something. */
export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  brand_primary: "DAY CARE",
  brand_accent: "SURGERIES",
  logo: null,
  description:
    "Day Care Surgeries connects patients with trusted, associated hospitals and specialists for safe, affordable same-day surgical care, closer to home.",
  cta_enabled: true,
  cta_heading: "Ready to take the next step?",
  cta_description: "Book a free consultation and our care team will call you back to confirm your appointment.",
  cta_button_label: "Book an Appointment",
  cta_button_url: "",
  copyright_text: "© {year} Day Care Surgeries. All rights reserved.",
  columns: [
    {
      title: "Explore",
      enabled: true,
      links: [
        { label: "Specialities & Treatments", href: "{home}#specialized-care-heading" },
        { label: "Hospitals", href: "{home}#hospitals-heading" },
        { label: "Doctors", href: "{home}#doctors-heading" },
      ],
      include: [],
    },
    {
      title: "Patients",
      enabled: true,
      links: [
        { label: "Book an Appointment", href: "{contact}" },
        { label: "Patient Reviews", href: "{home}#reviews-heading" },
        { label: "FAQs", href: "{home}#faq-heading" },
        { label: "Blogs", href: "{home}#blogs-heading" },
      ],
      include: [],
    },
    { title: "Cities We Serve", enabled: true, links: [], include: ["cities"] },
    { title: "Company", enabled: true, links: [], include: ["footer_menu", "pages"] },
  ],
  contact_items: [],
  social_links: [],
  bottom_links: [],
};
