import { apiFetch } from "./client";
import type { ContactPageSettings } from "@/types/contact-page-settings";

type ContactPageSettingsResponse = { success: true; settings: ContactPageSettings };

export function getContactPageSettings() {
  return apiFetch<ContactPageSettingsResponse>("/api/contact-page-settings");
}

export function updateContactPageSettings(data: ContactPageSettings) {
  return apiFetch<ContactPageSettingsResponse>("/api/contact-page-settings", { method: "PUT", body: data });
}
