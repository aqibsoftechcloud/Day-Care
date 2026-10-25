import { apiFetch } from "./client";
import type {
  HomepageIconMap,
  HomepageIconOverrideMap,
  UpdateCityHomepageIconOverridesInput,
  UpdateGlobalHomepageIconsInput,
} from "@/types/homepage-icon-settings";

type GlobalIconsResponse = { success: true; icons: HomepageIconMap };
/** `global` is always the full, every-key-set map; `overrides` only contains the keys THIS city has actually overridden — the client derives each row's displayed value and "is this an override" state from the two together, never a separately pre-merged "resolved" shape. */
type CityIconsResponse = { success: true; global: HomepageIconMap; overrides: HomepageIconOverrideMap };
type UpdateCityIconsResponse = { success: true; overrides: HomepageIconOverrideMap };

export function getGlobalHomepageIcons() {
  return apiFetch<GlobalIconsResponse>("/api/homepage-icon-settings");
}

export function updateGlobalHomepageIcons(data: UpdateGlobalHomepageIconsInput) {
  return apiFetch<GlobalIconsResponse>("/api/homepage-icon-settings", { method: "PUT", body: data });
}

export function resetGlobalHomepageIcons() {
  return apiFetch<GlobalIconsResponse>("/api/homepage-icon-settings/reset", { method: "POST" });
}

export function getCityHomepageIconOverrides(cityId: number) {
  return apiFetch<CityIconsResponse>(`/api/homepage-icon-settings/cities/${cityId}`);
}

export function updateCityHomepageIconOverrides(cityId: number, data: UpdateCityHomepageIconOverridesInput) {
  return apiFetch<UpdateCityIconsResponse>(`/api/homepage-icon-settings/cities/${cityId}`, {
    method: "PUT",
    body: data,
  });
}

export function resetCityHomepageIconOverrides(cityId: number) {
  return apiFetch<UpdateCityIconsResponse>(`/api/homepage-icon-settings/cities/${cityId}/reset`, { method: "POST" });
}
