/** Centralized TanStack Query keys for Homepage Icons Management (gated by the "homepage-icons" permission slug). */
export const homepageIconSettingsKeys = {
  global: ["homepage-icon-settings", "global"] as const,
  city: (cityId: number) => ["homepage-icon-settings", "city", cityId] as const,
};

/** Shared across every `IconPicker` instance on the page (one per configurable icon) — the uploaded-custom-icons list is the same regardless of which icon row's popover is open, so this is one cache entry, not N. */
export const homepageCustomIconsKeys = {
  all: ["homepage-custom-icons"] as const,
};
