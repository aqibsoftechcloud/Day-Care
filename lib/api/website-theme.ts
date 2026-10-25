import { apiFetch } from "./client";
import type { WebsiteThemeTokens } from "@/types/website-theme";

type WebsiteThemeResponse = { success: true; tokens: WebsiteThemeTokens };

export function getWebsiteTheme() {
  return apiFetch<WebsiteThemeResponse>("/api/website-theme");
}

export function updateWebsiteTheme(tokens: WebsiteThemeTokens) {
  return apiFetch<WebsiteThemeResponse>("/api/website-theme", { method: "PUT", body: tokens });
}

export function resetWebsiteTheme() {
  return apiFetch<WebsiteThemeResponse>("/api/website-theme/reset", { method: "POST" });
}
