/**
 * Every independently-configurable homepage icon slot, across all three
 * sections in scope. Single source of truth shared by the validator, the
 * service's hardcoded safe defaults, the admin UI's tab layout, and the
 * public resolver — adding a new configurable icon means adding one key
 * here and nowhere else needs to re-derive the set.
 */
export const HOMEPAGE_ICON_KEYS = [
  "hero_specialities",
  "hero_treatments",
  "hero_doctors",
  "hero_hospitals",
  "why_verified_specialists",
  "why_associated_hospitals",
  "why_transparent_process",
  "why_patient_first_support",
  "location",
] as const;

export type HomepageIconKey = (typeof HOMEPAGE_ICON_KEYS)[number];

/**
 * A single configured icon — a TAGGED union, never a bare string, so a
 * Lucide icon name can never be confused with a reference into
 * `homepage_custom_icons` (see that model's own schema doc comment).
 * `name` is validated against `lib/icon-registry.ts`'s static allowlist;
 * `assetId` is validated (at write time, service-layer) against a real
 * `homepage_custom_icons` row.
 */
export type HomepageIconValue = { type: "lucide"; name: string } | { type: "custom"; assetId: number };

/** The Global row's resolved shape — every key always has a real value, never null, since it's the final fallback before the hardcoded default. */
export type HomepageIconMap = Record<HomepageIconKey, HomepageIconValue>;

/** A City override row's shape — every key is optional; a missing/null key means "not overridden, inherit the global row's value." */
export type HomepageIconOverrideMap = Partial<Record<HomepageIconKey, HomepageIconValue | null>>;

export type UpdateGlobalHomepageIconsInput = HomepageIconMap;
export type UpdateCityHomepageIconOverridesInput = HomepageIconOverrideMap;
