import { prisma } from "@/lib/prisma";
import { DEFAULT_CONTACT_PAGE_SETTINGS, type ContactPageSettings } from "@/types/contact-page-settings";
import { contactItemsSchema, type UpdateContactPageSettingsInput } from "@/validators/contact-page-settings.validator";

/** Single-row convention (always id=1) — same pattern as consultation_form_settings / website_theme_settings. */
const SETTINGS_ROW_ID = 1;

type SettingsRow = {
  badge_text: string | null;
  show_badge: boolean;
  heading: string;
  description: string;
  show_contact_details: boolean;
  contact_items: unknown;
  form_position: string;
  show_form_heading: boolean;
  meta_title: string | null;
  meta_description: string | null;
  meta_keyword: string | null;
};

/**
 * `strict` (public page): an invalid stored `contact_items` throws instead of
 * silently showing no contact details. A missing row is the legitimate
 * "never customised" state and uses the defaults. The admin editor reads
 * leniently so it can open and repair a bad value.
 */
function toSettings(row: SettingsRow | null, strict: boolean): ContactPageSettings {
  const defaults = DEFAULT_CONTACT_PAGE_SETTINGS;
  if (!row) return { ...defaults, contact_items: [] };

  const parsed = row.contact_items == null ? { success: true as const, data: [] } : contactItemsSchema.safeParse(row.contact_items);
  if (!parsed.success) {
    if (strict) throw new Error("Stored contact page items are invalid: " + JSON.stringify(parsed.error.issues));
    console.error("Stored contact page items are invalid, showing none:", parsed.error.issues);
  }

  return {
    badge_text: row.badge_text ?? "",
    show_badge: row.show_badge,
    heading: row.heading,
    description: row.description,
    show_contact_details: row.show_contact_details,
    contact_items: parsed.success ? parsed.data : [],
    form_position: row.form_position === "left" ? "left" : "right",
    show_form_heading: row.show_form_heading,
    meta_title: row.meta_title ?? "",
    meta_description: row.meta_description ?? "",
    meta_keyword: row.meta_keyword ?? "",
  };
}

export async function getContactPageSettings(options: { strict?: boolean } = {}): Promise<ContactPageSettings> {
  const row = await prisma.contact_page_settings.findUnique({ where: { id: SETTINGS_ROW_ID } });
  return toSettings(row, options.strict ?? false);
}

export async function updateContactPageSettings(data: UpdateContactPageSettingsInput): Promise<ContactPageSettings> {
  const values = {
    badge_text: data.badge_text || null,
    show_badge: data.show_badge,
    heading: data.heading,
    description: data.description,
    show_contact_details: data.show_contact_details,
    contact_items: data.contact_items,
    form_position: data.form_position,
    show_form_heading: data.show_form_heading,
    meta_title: data.meta_title || null,
    meta_description: data.meta_description || null,
    meta_keyword: data.meta_keyword || null,
  };

  const row = await prisma.contact_page_settings.upsert({
    where: { id: SETTINGS_ROW_ID },
    create: { id: SETTINGS_ROW_ID, ...values },
    update: { ...values, updated_at: new Date() },
  });

  return toSettings(row, false);
}
