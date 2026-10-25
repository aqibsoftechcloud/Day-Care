import { prisma } from "@/lib/prisma";
import { storageProvider } from "@/lib/storage";
import type { UploadInput } from "@/lib/storage";
import { DEFAULT_FOOTER_SETTINGS, type FooterSettings } from "@/types/footer-settings";
import {
  footerBottomLinksSchema,
  footerColumnsSchema,
  footerSocialLinksSchema,
  type UpdateFooterSettingsInput,
} from "@/validators/footer-settings.validator";
import { contactItemsSchema } from "@/validators/contact-page-settings.validator";

export type FooterLogoInput = UploadInput;

const FOOTER_UPLOAD_FOLDER = "footer";

/** Single-row convention (always id=1) — same pattern as consultation_form_settings / contact_page_settings. */
const SETTINGS_ROW_ID = 1;

type SettingsRow = {
  brand_primary: string;
  brand_accent: string | null;
  logo: string | null;
  description: string;
  cta_enabled: boolean;
  cta_heading: string;
  cta_description: string;
  cta_button_label: string;
  cta_button_url: string | null;
  copyright_text: string;
  columns: unknown;
  contact_items: unknown;
  social_links: unknown;
  bottom_links: unknown;
};

function cloneDefaults(): FooterSettings {
  return JSON.parse(JSON.stringify(DEFAULT_FOOTER_SETTINGS)) as FooterSettings;
}

/**
 * `strict` (public footer): an invalid stored JSON block throws so the
 * caller can log it and decide, rather than silently dropping part of the
 * footer. A missing row is the legitimate "never customised" state and uses
 * the built-in defaults (the original footer). The admin editor reads
 * leniently so it can open and repair a bad value.
 */
function toSettings(row: SettingsRow | null, strict: boolean): FooterSettings {
  const defaults = cloneDefaults();
  if (!row) return defaults;

  const read = <T,>(schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { issues: unknown } } }, value: unknown, fallback: T, name: string): T => {
    if (value == null) return fallback;
    const parsed = schema.safeParse(value);
    if (parsed.success) return parsed.data;
    if (strict) throw new Error(`Stored footer ${name} is invalid: ${JSON.stringify(parsed.error.issues)}`);
    console.error(`Stored footer ${name} is invalid, using defaults:`, parsed.error.issues);
    return fallback;
  };

  return {
    brand_primary: row.brand_primary,
    brand_accent: row.brand_accent ?? "",
    logo: row.logo,
    description: row.description,
    cta_enabled: row.cta_enabled,
    cta_heading: row.cta_heading,
    cta_description: row.cta_description,
    cta_button_label: row.cta_button_label,
    cta_button_url: row.cta_button_url ?? "",
    copyright_text: row.copyright_text,
    columns: read(footerColumnsSchema, row.columns, defaults.columns, "columns"),
    contact_items: read(contactItemsSchema, row.contact_items, [], "contact items"),
    social_links: read(footerSocialLinksSchema, row.social_links, [], "social links"),
    bottom_links: read(footerBottomLinksSchema, row.bottom_links, [], "bottom links"),
  };
}

export async function getFooterSettings(options: { strict?: boolean } = {}): Promise<FooterSettings> {
  const row = await prisma.footer_settings.findUnique({ where: { id: SETTINGS_ROW_ID } });
  return toSettings(row, options.strict ?? false);
}

/**
 * `logo` has three states, same as every other optional image in this
 * project: `undefined` = keep the stored logo, `null` = remove it, a file =
 * replace it. The new file is uploaded first; the old one is deleted only
 * after the database update succeeds (and the new one cleaned up if it
 * fails).
 */
export async function updateFooterSettings(data: UpdateFooterSettingsInput, logo?: FooterLogoInput | null): Promise<FooterSettings> {
  const current = await prisma.footer_settings.findUnique({ where: { id: SETTINGS_ROW_ID }, select: { logo: true } });

  let newLogoPath: string | null | undefined;
  if (logo === null) {
    newLogoPath = null;
  } else if (logo) {
    newLogoPath = await storageProvider.upload(logo, FOOTER_UPLOAD_FOLDER);
  }

  const values = {
    brand_primary: data.brand_primary,
    brand_accent: data.brand_accent || null,
    description: data.description,
    cta_enabled: data.cta_enabled,
    cta_heading: data.cta_heading,
    cta_description: data.cta_description,
    cta_button_label: data.cta_button_label,
    cta_button_url: data.cta_button_url || null,
    copyright_text: data.copyright_text,
    columns: data.columns,
    contact_items: data.contact_items,
    social_links: data.social_links,
    bottom_links: data.bottom_links,
    ...(newLogoPath !== undefined ? { logo: newLogoPath } : {}),
  };

  try {
    const row = await prisma.footer_settings.upsert({
      where: { id: SETTINGS_ROW_ID },
      create: { id: SETTINGS_ROW_ID, ...values },
      update: { ...values, updated_at: new Date() },
    });

    if (newLogoPath !== undefined && current?.logo) {
      await storageProvider.delete(current.logo).catch((error) => console.error("Failed to delete old footer logo:", error));
    }

    return toSettings(row, false);
  } catch (error) {
    if (newLogoPath) {
      await storageProvider.delete(newLogoPath).catch((cleanupError) => console.error("Failed to clean up newly uploaded footer logo:", cleanupError));
    }
    throw error;
  }
}
