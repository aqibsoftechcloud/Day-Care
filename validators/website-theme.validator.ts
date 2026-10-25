import { z } from "zod";

/**
 * Strict 6-digit hex only (`#rrggbb`). This alone is what keeps the
 * feature safe from CSS injection — `url(...)`, `javascript:...`,
 * `expression(...)`, `rgba(...)`, `var(...)` etc. all fail this regex
 * and are rejected with a 400 before ever reaching the database or a
 * rendered `<style>` tag.
 */
const hex = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a 6-digit hex color, e.g. #00283b");

/** Every token is required — a partial payload is rejected rather than silently merged, matching how other Json-column content (treatment_sections.content, etc.) is always written whole. */
export const websiteThemeTokensSchema = z.object({
  colorPrimary: hex,
  colorAccent: hex,

  heroBackground: hex,
  heroHeading: hex,
  heroEyebrow: hex,

  ctaPrimaryBackground: hex,
  ctaPrimaryText: hex,
  ctaSecondaryBorder: hex,
  ctaSecondaryText: hex,

  headerBackground: hex,
  headerText: hex,
  headerActive: hex,

  footerBackground: hex,
  footerHeading: hex,
  footerLink: hex,

  formFocus: hex,

  cardBackground: hex,
  cardBorder: hex,

  faqBackground: hex,
  faqBorder: hex,
  faqHeading: hex,
  faqIcon: hex,

  textHeading: hex,
  textBody: hex,
  textMuted: hex,

  bgPage: hex,
  bgSurface: hex,

  linkDefault: hex,
  linkHover: hex,

  iconColor: hex,
  iconBackground: hex,
  iconBorder: hex,
});

export const updateWebsiteThemeSchema = websiteThemeTokensSchema;

export type UpdateWebsiteThemeInput = z.infer<typeof updateWebsiteThemeSchema>;
