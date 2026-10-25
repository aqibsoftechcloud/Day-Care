/**
 * The public website's full set of admin-editable design tokens. Every
 * value is a 6-digit hex color string (`#rrggbb`) — enforced by
 * validators/website-theme.validator.ts, never a CSS function (`url()`,
 * `rgba()`, `var()`, …), so nothing here can inject arbitrary CSS.
 *
 * Grouped to mirror the admin UI's layout (Brand/Hero/CTA/Header/Footer/
 * Form/Card/FAQ/Text/Background/Link) — see WEBSITE_THEME_TOKEN_GROUPS
 * below, the single source of truth both the admin page and this type
 * are derived from conceptually.
 */
export type WebsiteThemeTokens = {
  colorPrimary: string;
  colorAccent: string;

  heroBackground: string;
  heroHeading: string;
  heroEyebrow: string;

  ctaPrimaryBackground: string;
  ctaPrimaryText: string;
  ctaSecondaryBorder: string;
  ctaSecondaryText: string;

  headerBackground: string;
  headerText: string;
  headerActive: string;

  footerBackground: string;
  footerHeading: string;
  footerLink: string;

  formFocus: string;

  cardBackground: string;
  cardBorder: string;

  faqBackground: string;
  faqBorder: string;
  faqHeading: string;
  faqIcon: string;

  textHeading: string;
  textBody: string;
  textMuted: string;

  bgPage: string;
  bgSurface: string;

  linkDefault: string;
  linkHover: string;

  iconColor: string;
  iconBackground: string;
  iconBorder: string;
};

export type WebsiteThemeTokenKey = keyof WebsiteThemeTokens;

/**
 * The CURRENT production appearance, captured exactly as it exists in
 * app/globals.css (`--public-primary`/`--public-accent`) and the literal
 * Tailwind neutrals (slate-50/200/500/600/900, white) used throughout
 * components/public/**. This is both the factory default shipped to a
 * fresh `website_theme_settings` row and the target "Reset to Default"
 * restores — it must never drift from what the site actually renders
 * before this feature existed.
 */
export const DEFAULT_WEBSITE_THEME_TOKENS: WebsiteThemeTokens = {
  colorPrimary: "#00283b",
  colorAccent: "#ff7200",

  heroBackground: "#00283b",
  heroHeading: "#ffffff",
  heroEyebrow: "#ff7200",

  ctaPrimaryBackground: "#ff7200",
  ctaPrimaryText: "#ffffff",
  ctaSecondaryBorder: "#ffffff",
  ctaSecondaryText: "#ffffff",

  headerBackground: "#00283b",
  headerText: "#ffffff",
  headerActive: "#ff7200",

  footerBackground: "#00283b",
  footerHeading: "#ffffff",
  footerLink: "#ff7200",

  formFocus: "#ff7200",

  cardBackground: "#ffffff",
  cardBorder: "#e2e8f0",

  faqBackground: "#f8fafc",
  faqBorder: "#e2e8f0",
  faqHeading: "#00283b",
  faqIcon: "#ff7200",

  textHeading: "#0f172a",
  textBody: "#475569",
  textMuted: "#64748b",

  bgPage: "#f8fafc",
  bgSurface: "#ffffff",

  linkDefault: "#00283b",
  linkHover: "#ff7200",

  // Reproduces the pre-existing, pre-this-feature appearance exactly:
  // Lucide icons rendered `text-(--public-primary)` (navy), inside a
  // container tinted `bg-(--public-primary)/6` (navy at 6% opacity over
  // white) with no border. `#f0f2f3` is that same navy-at-6%-over-white
  // mix computed to a flat hex (this token system only stores opaque
  // 6-digit hex, no alpha channel) — not an arbitrary new color choice.
  // `iconBorder` defaults to the SAME value as `iconBackground` so the
  // 1px border Tailwind's `border` utility always applies is invisible
  // by default (fill and border match) until an admin deliberately picks
  // a different border color — no separate "enable border" flag needed.
  iconColor: "#00283b",
  iconBackground: "#f0f2f3",
  iconBorder: "#f0f2f3",
};

export type WebsiteThemeTokenGroup = {
  key: string;
  label: string;
  description: string;
  tokens: { key: WebsiteThemeTokenKey; label: string }[];
};

/** Drives both the admin page's section layout and its field labels — the one place token grouping/labeling is defined. */
export const WEBSITE_THEME_TOKEN_GROUPS: WebsiteThemeTokenGroup[] = [
  {
    key: "brand",
    label: "Brand Colors",
    description: "The two core brand colors used across nearly every page — the biggest-impact change you can make here.",
    tokens: [
      { key: "colorPrimary", label: "Primary (navy)" },
      { key: "colorAccent", label: "Accent (orange)" },
    ],
  },
  {
    key: "hero",
    label: "Hero Sections",
    description: "The large banner at the top of Homepage, Treatment, Speciality, and Global pages.",
    tokens: [
      { key: "heroBackground", label: "Background" },
      { key: "heroHeading", label: "Heading text" },
      { key: "heroEyebrow", label: "Eyebrow / label text" },
    ],
  },
  {
    key: "cta",
    label: "Buttons & CTAs",
    description: "Primary (filled) and secondary (outline) call-to-action buttons used throughout the site.",
    tokens: [
      { key: "ctaPrimaryBackground", label: "Primary button background" },
      { key: "ctaPrimaryText", label: "Primary button text" },
      { key: "ctaSecondaryBorder", label: "Secondary button border" },
      { key: "ctaSecondaryText", label: "Secondary button text" },
    ],
  },
  {
    key: "header",
    label: "Header",
    description: "The site's top navigation bar.",
    tokens: [
      { key: "headerBackground", label: "Background" },
      { key: "headerText", label: "Text" },
      { key: "headerActive", label: "Active / hover accent" },
    ],
  },
  {
    key: "footer",
    label: "Footer",
    description: "The site-wide footer.",
    tokens: [
      { key: "footerBackground", label: "Background" },
      { key: "footerHeading", label: "Heading text" },
      { key: "footerLink", label: "Link hover color" },
    ],
  },
  {
    key: "form",
    label: "Forms",
    description: "The appointment / consultation lead form.",
    tokens: [{ key: "formFocus", label: "Focus ring color" }],
  },
  {
    key: "card",
    label: "Cards",
    description: "Content cards (doctors, hospitals, blogs, treatments).",
    tokens: [
      { key: "cardBackground", label: "Background" },
      { key: "cardBorder", label: "Border" },
    ],
  },
  {
    key: "faq",
    label: "FAQ",
    description: "Frequently Asked Questions accordions.",
    tokens: [
      { key: "faqBackground", label: "Closed item background" },
      { key: "faqBorder", label: "Border" },
      { key: "faqHeading", label: "Question text" },
      { key: "faqIcon", label: "Expand icon" },
    ],
  },
  {
    key: "text",
    label: "Text",
    description: "Neutral body text colors used in cards, forms, and content blocks (not brand-colored headings).",
    tokens: [
      { key: "textHeading", label: "Heading" },
      { key: "textBody", label: "Body" },
      { key: "textMuted", label: "Muted" },
    ],
  },
  {
    key: "background",
    label: "Backgrounds",
    description: "Page and surface backgrounds.",
    tokens: [
      { key: "bgPage", label: "Page background" },
      { key: "bgSurface", label: "Surface (card/panel) background" },
    ],
  },
  {
    key: "link",
    label: "Links",
    description: "Inline text links.",
    tokens: [
      { key: "linkDefault", label: "Default" },
      { key: "linkHover", label: "Hover" },
    ],
  },
  {
    key: "icon",
    label: "Icons",
    description:
      "Homepage icon containers (Hero Statistics, Why Choose Us, Our Locations). Icon color applies to icon-library (Lucide) selections only — uploaded custom image icons keep their own original colors and are not affected by this setting.",
    tokens: [
      { key: "iconColor", label: "Icon color (Lucide only)" },
      { key: "iconBackground", label: "Icon background" },
      { key: "iconBorder", label: "Icon border (optional — matches background by default)" },
    ],
  },
];
