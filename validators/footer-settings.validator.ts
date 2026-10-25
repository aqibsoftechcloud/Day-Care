import { z } from "zod";
import { isSafeUrl } from "@/lib/rich-text";
import { contactItemsSchema } from "@/validators/contact-page-settings.validator";
import {
  FOOTER_CONTACT_TOKEN,
  FOOTER_HOME_TOKEN,
  FOOTER_INCLUDE_SOURCES,
  MAX_FOOTER_COLUMNS,
  MAX_FOOTER_LINKS_PER_COLUMN,
  SOCIAL_PLATFORMS,
} from "@/types/footer-settings";

/**
 * A footer link target: a site path (`/x`), an in-page anchor (`#x`), a full
 * `http(s)`/`mailto:`/`tel:` URL, or one of the two render-time tokens
 * (`{home}`, `{contact}`, optionally followed by `#anchor`). Anything else —
 * including `javascript:`/`data:` and protocol-relative `//host` — is rejected.
 */
export function isValidFooterHref(value: string): boolean {
  const href = value.trim();
  if (!href) return false;

  for (const token of [FOOTER_HOME_TOKEN, FOOTER_CONTACT_TOKEN]) {
    if (href.startsWith(token)) {
      const rest = href.slice(token.length);
      return rest === "" || rest.startsWith("#") || rest.startsWith("?");
    }
  }

  if (!isSafeUrl(href)) return false;
  if (href.startsWith("//")) return false;
  return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(href);
}

const hrefSchema = z.string().trim().min(1, "Link URL is required").max(500).refine(isValidFooterHref, {
  message: "Use a /path, #anchor, https:// URL, mailto:, tel:, {home} or {contact}",
});

export const footerLinkSchema = z.object({
  label: z.string().trim().min(1, "Link label is required").max(100),
  href: hrefSchema,
});

export const footerColumnSchema = z.object({
  title: z.string().trim().min(1, "Column heading is required").max(100),
  enabled: z.boolean(),
  links: z.array(footerLinkSchema).max(MAX_FOOTER_LINKS_PER_COLUMN, `At most ${MAX_FOOTER_LINKS_PER_COLUMN} links per column`),
  include: z.array(z.enum(FOOTER_INCLUDE_SOURCES)).max(FOOTER_INCLUDE_SOURCES.length),
});

export const footerSocialLinkSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .max(500)
    .refine((value) => /^https?:\/\//i.test(value) && isSafeUrl(value), { message: "Use a full https:// URL" }),
  visible: z.boolean(),
});

export const footerColumnsSchema = z.array(footerColumnSchema).max(MAX_FOOTER_COLUMNS, `At most ${MAX_FOOTER_COLUMNS} columns`);
export const footerSocialLinksSchema = z.array(footerSocialLinkSchema).max(SOCIAL_PLATFORMS.length * 2);
export const footerBottomLinksSchema = z.array(footerLinkSchema).max(10);

/** Everything except `logo`, which is an uploaded file handled separately (see the controller). */
export const updateFooterSettingsSchema = z.object({
  brand_primary: z.string().trim().min(1, "Brand text is required").max(100),
  brand_accent: z.string().trim().max(100),
  description: z.string().trim().max(1000),
  cta_enabled: z.boolean(),
  cta_heading: z.string().trim().min(1, "CTA heading is required").max(255),
  cta_description: z.string().trim().max(500),
  cta_button_label: z.string().trim().min(1, "Button label is required").max(100),
  cta_button_url: z.string().trim().max(500).refine((value) => value === "" || isValidFooterHref(value), {
    message: "Use a /path, https:// URL, mailto:, tel:, {home} or {contact} (or leave empty for Contact Us)",
  }),
  copyright_text: z.string().trim().min(1, "Copyright text is required").max(500),
  columns: footerColumnsSchema,
  contact_items: contactItemsSchema,
  social_links: footerSocialLinksSchema,
  bottom_links: footerBottomLinksSchema,
});

export type UpdateFooterSettingsInput = z.infer<typeof updateFooterSettingsSchema>;
