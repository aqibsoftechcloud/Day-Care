import { apiFetch } from "./client";
import type { FooterSettings } from "@/types/footer-settings";

type FooterSettingsResponse = { success: true; settings: FooterSettings };

export function getFooterSettings() {
  return apiFetch<FooterSettingsResponse>("/api/footer-settings");
}

/** Multipart: `settings` is the JSON, `logo` an optional file. Omit `logo` to keep the stored one, pass `null` to remove it. */
export function updateFooterSettings(data: Omit<FooterSettings, "logo">, logo?: File | null) {
  const formData = new FormData();
  formData.append("settings", JSON.stringify(data));

  if (logo) {
    formData.append("logo", logo);
  } else if (logo === null) {
    formData.append("logo", "");
  }

  return apiFetch<FooterSettingsResponse>("/api/footer-settings", { method: "PUT", body: formData });
}
