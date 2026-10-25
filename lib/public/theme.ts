import { cache } from "react";
import { getWebsiteTheme } from "@/services/website-theme.service";
import { DEFAULT_WEBSITE_THEME_TOKENS, type WebsiteThemeTokens } from "@/types/website-theme";

/**
 * Resolves the public site's design tokens exactly once per request.
 * `react`'s `cache()` dedupes this across the single render pass — the
 * one call site is `app/(public)/layout.tsx`; no other public component
 * should import this. Falls back to the exact production defaults on
 * any DB error so a theme-table problem can never take down the public
 * site.
 */
export const getPublicTheme = cache(async (): Promise<WebsiteThemeTokens> => {
  try {
    return await getWebsiteTheme();
  } catch (error) {
    console.error("Failed to resolve website theme, falling back to defaults:", error);
    return { ...DEFAULT_WEBSITE_THEME_TOKENS };
  }
});

const CSS_VAR_NAMES: Record<keyof WebsiteThemeTokens, string> = {
  colorPrimary: "--public-primary",
  colorAccent: "--public-accent",

  heroBackground: "--color-hero-background",
  heroHeading: "--color-hero-heading",
  heroEyebrow: "--color-hero-eyebrow",

  ctaPrimaryBackground: "--color-cta-primary-bg",
  ctaPrimaryText: "--color-cta-primary-text",
  ctaSecondaryBorder: "--color-cta-secondary-border",
  ctaSecondaryText: "--color-cta-secondary-text",

  headerBackground: "--color-header-background",
  headerText: "--color-header-text",
  headerActive: "--color-header-active",

  footerBackground: "--color-footer-background",
  footerHeading: "--color-footer-heading",
  footerLink: "--color-footer-link",

  formFocus: "--color-form-focus",

  cardBackground: "--color-card-background",
  cardBorder: "--color-card-border",

  faqBackground: "--color-faq-background",
  faqBorder: "--color-faq-border",
  faqHeading: "--color-faq-heading",
  faqIcon: "--color-faq-icon",

  textHeading: "--color-text-heading",
  textBody: "--color-text-body",
  textMuted: "--color-text-muted",

  bgPage: "--color-bg-page",
  bgSurface: "--color-bg-surface",

  linkDefault: "--color-link-default",
  linkHover: "--color-link-hover",

  iconColor: "--color-icon-foreground",
  iconBackground: "--color-icon-background",
  iconBorder: "--color-icon-border",
};

/**
 * Renders the resolved tokens as a `:root { --var: value; }` block.
 * `colorPrimary`/`colorAccent` deliberately reuse the EXISTING
 * `--public-primary`/`--public-accent` variable names already referenced
 * across ~90 public components (via `bg-(--public-primary)` etc.) — this
 * is what lets an admin color change propagate site-wide with zero
 * component migration for those two. Every other token is a new,
 * narrower `--color-*` variable that only the explicitly-migrated
 * priority components (Header, Footer, Hero, CTA, Consultation form,
 * FAQ) currently read; the rest of the site simply doesn't reference
 * them yet (see the final report's "not yet migrated" list).
 *
 * All values are pre-validated 6-digit hex by
 * validators/website-theme.validator.ts before they ever reach the
 * database, so interpolating them directly into a `<style>` tag here
 * carries no CSS-injection risk — a non-hex value cannot have been
 * saved in the first place.
 */
export function themeTokensToCssText(tokens: WebsiteThemeTokens): string {
  const declarations = Object.entries(tokens)
    .map(([key, value]) => {
      const varName = CSS_VAR_NAMES[key as keyof WebsiteThemeTokens];
      return varName ? `  ${varName}: ${value};` : "";
    })
    .filter(Boolean)
    .join("\n");

  return `:root {\n${declarations}\n}`;
}
