import { getContactPageSettings } from "@/services/contact-page-settings.service";
import { DEFAULT_CONTACT_PAGE_SETTINGS, type ContactItem, type ContactPageSettings } from "@/types/contact-page-settings";

export type PublicContactPage = {
  settings: ContactPageSettings;
  /** True when the saved content could not be loaded; the page then renders the built-in headline with NO contact details and says so, instead of presenting stale or invented data. */
  loadError: boolean;
};

/**
 * Admin-managed content for `/contact-us` (Admin → Settings → Contact Page
 * Settings). Read strictly: an invalid stored value is reported through
 * `loadError`, never silently swapped for different content. The form on
 * the page is separate and always comes from Consultation Form Settings.
 */
export async function getPublicContactPage(): Promise<PublicContactPage> {
  try {
    return { settings: await getContactPageSettings({ strict: true }), loadError: false };
  } catch (error) {
    console.error("Failed to load the contact page settings (rendering the page with an error notice):", error);
    return { settings: { ...DEFAULT_CONTACT_PAGE_SETTINGS, contact_items: [] }, loadError: true };
  }
}

/** Email and phone rows become mailto:/tel: links; everything else is plain text (never an admin-supplied URL scheme). */
export function contactItemHref(item: ContactItem): string | null {
  if (item.icon === "email") return `mailto:${item.value}`;
  if (item.icon === "phone") {
    const dialable = item.value.replace(/[^\d+]/g, "");
    return dialable.replace(/\D/g, "").length >= 5 ? `tel:${dialable}` : null;
  }
  return null;
}
