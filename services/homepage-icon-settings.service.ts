import { prisma } from "@/lib/prisma";
import { getCityById } from "@/services/city.service";
import {
  HOMEPAGE_ICON_KEYS,
  type HomepageIconKey,
  type HomepageIconMap,
  type HomepageIconOverrideMap,
  type HomepageIconValue,
} from "@/types/homepage-icon-settings";
import type {
  UpdateCityHomepageIconOverridesInput,
  UpdateGlobalHomepageIconsInput,
} from "@/validators/homepage-icon-settings.validator";

export class CityNotFoundError extends Error {
  constructor(id: number) {
    super(`City with id ${id} not found`);
    this.name = "CityNotFoundError";
  }
}

export class CustomIconAssetNotFoundError extends Error {
  constructor(assetId: number) {
    super(`Custom icon with id ${assetId} not found`);
    this.name = "CustomIconAssetNotFoundError";
  }
}

/**
 * Single-row convention (always id=1) for the GLOBAL row, matching
 * `website_theme_settings`'s own "only one row, service-enforced"
 * invariant — see that service's own doc comment.
 */
const GLOBAL_SETTINGS_ROW_ID = 1;

/**
 * Hardcoded safe defaults — the exact icons the public homepage
 * components used before this feature existed (`Stethoscope`/`Syringe`/
 * `UserRound`/`Building2` for the Hero stats, the original four Why
 * Choose icons, `MapPin` for a location card). The final fallback tier
 * when neither a city override nor the global row has a value for a
 * key — this can only happen before the global row is first saved, or if
 * a stored value somehow fails the allowlist check at render time.
 */
export const DEFAULT_HOMEPAGE_ICONS: HomepageIconMap = {
  hero_specialities: { type: "lucide", name: "Stethoscope" },
  hero_treatments: { type: "lucide", name: "Syringe" },
  hero_doctors: { type: "lucide", name: "UserRound" },
  hero_hospitals: { type: "lucide", name: "Building2" },
  why_verified_specialists: { type: "lucide", name: "Stethoscope" },
  why_associated_hospitals: { type: "lucide", name: "ShieldCheck" },
  why_transparent_process: { type: "lucide", name: "Wallet" },
  why_patient_first_support: { type: "lucide", name: "HeartHandshake" },
  location: { type: "lucide", name: "MapPin" },
};

/**
 * Reads one stored JSON value as a `HomepageIconValue`, tolerating a
 * legacy plain string (written before the tagged-union shape existed —
 * see `homepage_icon_settings.icons`'s own schema doc comment) by
 * treating it as `{type: "lucide", name: <string>}`. Returns `null` for
 * anything else unrecognizable (never throws — a single corrupted key
 * must not break the whole row; the caller's own fallback chain takes
 * over for that key).
 */
function parseIconValue(raw: unknown): HomepageIconValue | null {
  if (typeof raw === "string" && raw.length > 0) {
    return { type: "lucide", name: raw };
  }

  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (obj.type === "lucide" && typeof obj.name === "string" && obj.name.length > 0) {
      return { type: "lucide", name: obj.name };
    }
    if (obj.type === "custom" && typeof obj.assetId === "number" && Number.isInteger(obj.assetId)) {
      return { type: "custom", assetId: obj.assetId };
    }
  }

  return null;
}

function mergeGlobalWithDefaults(stored: unknown): HomepageIconMap {
  const result = { ...DEFAULT_HOMEPAGE_ICONS };

  if (typeof stored !== "object" || stored === null) {
    return result;
  }

  for (const key of HOMEPAGE_ICON_KEYS) {
    const parsed = parseIconValue((stored as Record<string, unknown>)[key]);
    if (parsed) {
      result[key] = parsed;
    }
  }

  return result;
}

/** Only the keys actually present (non-null) in the stored JSON — a missing/null key is NOT filled with a default here, since callers need to distinguish "this city set nothing" from "this city chose the default value," to resolve the correct `source` tier. */
function toOverrideMap(stored: unknown): HomepageIconOverrideMap {
  if (typeof stored !== "object" || stored === null) {
    return {};
  }

  const result: HomepageIconOverrideMap = {};
  for (const key of HOMEPAGE_ICON_KEYS) {
    const parsed = parseIconValue((stored as Record<string, unknown>)[key]);
    if (parsed) {
      result[key] = parsed;
    }
  }
  return result;
}

async function ensureCityExists(cityId: number) {
  try {
    await getCityById(cityId);
  } catch {
    throw new CityNotFoundError(cityId);
  }
}

/** Validates every `{type: "custom", assetId}` value in a payload against real `homepage_custom_icons` rows in ONE query — never N+1 across up to 9 keys. Lucide values need no such check; `lib/icon-registry.ts`'s allowlist already validated those at the Zod layer. */
async function ensureCustomIconAssetsExist(values: (HomepageIconValue | null | undefined)[]) {
  const assetIds = [...new Set(values.filter((v): v is Extract<HomepageIconValue, { type: "custom" }> => v?.type === "custom").map((v) => v.assetId))];

  if (assetIds.length === 0) return;

  const found = await prisma.homepage_custom_icons.findMany({
    where: { id: { in: assetIds } },
    select: { id: true },
  });
  const foundIds = new Set(found.map((row) => row.id));

  const missing = assetIds.find((id) => !foundIds.has(id));
  if (missing !== undefined) {
    throw new CustomIconAssetNotFoundError(missing);
  }
}

export async function getGlobalHomepageIcons(): Promise<HomepageIconMap> {
  const row = await prisma.homepage_icon_settings.findUnique({
    where: { id: GLOBAL_SETTINGS_ROW_ID },
    select: { icons: true },
  });

  if (!row) {
    return { ...DEFAULT_HOMEPAGE_ICONS };
  }

  return mergeGlobalWithDefaults(row.icons);
}

export async function updateGlobalHomepageIcons(icons: UpdateGlobalHomepageIconsInput): Promise<HomepageIconMap> {
  await ensureCustomIconAssetsExist(Object.values(icons));

  await prisma.homepage_icon_settings.upsert({
    where: { id: GLOBAL_SETTINGS_ROW_ID },
    create: { id: GLOBAL_SETTINGS_ROW_ID, city_id: null, icons },
    update: { icons, updated_at: new Date() },
  });

  return icons;
}

export async function resetGlobalHomepageIcons(): Promise<HomepageIconMap> {
  return updateGlobalHomepageIcons({ ...DEFAULT_HOMEPAGE_ICONS });
}

export async function getCityHomepageIconOverrides(cityId: number): Promise<HomepageIconOverrideMap> {
  const row = await prisma.homepage_icon_settings.findUnique({
    where: { city_id: cityId },
    select: { icons: true },
  });

  if (!row) {
    return {};
  }

  return toOverrideMap(row.icons);
}

/**
 * The admin form always resends the FULL current override state for a
 * city (every key, `null` for "no override") rather than a sparse diff —
 * same "whole payload always" simplicity `website_theme_settings` uses —
 * so this is a plain upsert-with-replace, never a partial JSON merge
 * that would need to reconcile stale client state against concurrent
 * writes.
 */
export async function updateCityHomepageIconOverrides(
  cityId: number,
  overrides: UpdateCityHomepageIconOverridesInput
): Promise<HomepageIconOverrideMap> {
  await ensureCityExists(cityId);
  await ensureCustomIconAssetsExist(Object.values(overrides));

  // Json columns need the explicit `null`-key stripped before writing —
  // storing `{"location": null}` is indistinguishable from storing the
  // string "null" once round-tripped through some drivers, and it's
  // simpler to just never persist a key that means "absent" anyway.
  const toStore: Partial<Record<HomepageIconKey, HomepageIconValue>> = {};
  for (const key of HOMEPAGE_ICON_KEYS) {
    const value = overrides[key];
    if (value) {
      toStore[key] = value;
    }
  }

  await prisma.homepage_icon_settings.upsert({
    where: { city_id: cityId },
    create: { city_id: cityId, icons: toStore },
    update: { icons: toStore, updated_at: new Date() },
  });

  return toOverrideMap(toStore);
}

export async function resetCityHomepageIconOverrides(cityId: number): Promise<HomepageIconOverrideMap> {
  return updateCityHomepageIconOverrides(cityId, {});
}

/**
 * The PUBLIC-facing resolver — exactly the three-tier priority the
 * product brief specifies: this city's override, else the global
 * default, else the hardcoded safe default. `cityId: null` (the
 * nationwide homepage) always resolves to the global row alone, since
 * there is no city to override anything. One query for the global row
 * plus (at most) one for the city row — never N+1 across the 9 keys.
 */
export async function resolvePublicHomepageIcons(cityId: number | null): Promise<HomepageIconMap> {
  const global = await getGlobalHomepageIcons();
  if (cityId === null) {
    return global;
  }

  const overrides = await getCityHomepageIconOverrides(cityId);
  const resolved = { ...global };
  for (const key of HOMEPAGE_ICON_KEYS) {
    const overrideValue = overrides[key];
    if (overrideValue) {
      resolved[key] = overrideValue;
    }
  }
  return resolved;
}

/**
 * The "Our Locations" grid's own need: EACH city card's icon is resolved
 * against THAT city's own id (its own override, else the shared global
 * `location` default) — never the viewing page's city, so Hyderabad's
 * card looks identical whether seen from `/`, `/hyderabad`, or `/mumbai`.
 * One query for the global row, one `findMany` across every requested
 * city — never N+1 per card.
 */
export async function resolveLocationIconsForCities(cityIds: number[]): Promise<Record<number, HomepageIconValue>> {
  const global = await getGlobalHomepageIcons();

  if (cityIds.length === 0) {
    return {};
  }

  const rows = await prisma.homepage_icon_settings.findMany({
    where: { city_id: { in: cityIds } },
    select: { city_id: true, icons: true },
  });

  const overridesByCity = new Map(rows.map((row) => [row.city_id as number, toOverrideMap(row.icons)]));

  const result: Record<number, HomepageIconValue> = {};
  for (const cityId of cityIds) {
    result[cityId] = overridesByCity.get(cityId)?.location ?? global.location;
  }
  return result;
}
