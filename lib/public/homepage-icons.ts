import { cache } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  Stethoscope,
  Syringe,
  UserRound,
  Wallet,
} from "lucide-react";
import { resolveLocationIconsForCities, resolvePublicHomepageIcons } from "@/services/homepage-icon-settings.service";
import { getHomepageCustomIconsByIds } from "@/services/homepage-custom-icon.service";
import { getIconComponent } from "@/lib/icon-registry";
import type { HomepageIconKey, HomepageIconMap, HomepageIconValue } from "@/types/homepage-icon-settings";

/**
 * Public data layer for the three CMS-configurable homepage icon
 * sections (Hero Statistics, Why Choose Day Care Surgeries, Our
 * Locations). Converts each stored `HomepageIconValue` into a
 * `RenderableIcon` — either a real `LucideIcon` component (via the
 * static `lib/icon-registry.ts` allowlist, the one place a database
 * string becomes a component, always through a static lookup, never a
 * dynamic import) or a custom-asset image reference (a stored `path`
 * string, resolved by `assetId` against `homepage_custom_icons` —
 * never raw binary/base64, never rendered via `dangerouslySetInnerHTML`
 * even for an SVG asset, since `next/image`'s own `<img>` output is what
 * actually renders it).
 */
export type RenderableIcon =
  | { type: "lucide"; Icon: LucideIcon }
  | { type: "custom"; src: string; width: number | null; height: number | null };

/**
 * Each key's own hardcoded Lucide component below is the SAME icon
 * `services/homepage-icon-settings.service.ts`'s `DEFAULT_HOMEPAGE_ICONS`
 * names — used here as the typed, code-level fallback a resolved value
 * falls back to when it's a Lucide name outside the allowlist, OR a
 * custom `assetId` that no longer resolves to a real row (shouldn't
 * happen given the reference guard in `deleteHomepageCustomIcon`, but
 * handled defensively so a stale/corrupted reference can never break the
 * page — same "never fail to render an icon" guarantee as before).
 */
const HARDCODED_ICON_FALLBACKS: Record<HomepageIconKey, LucideIcon> = {
  hero_specialities: Stethoscope,
  hero_treatments: Syringe,
  hero_doctors: UserRound,
  hero_hospitals: Building2,
  why_verified_specialists: Stethoscope,
  why_associated_hospitals: ShieldCheck,
  why_transparent_process: Wallet,
  why_patient_first_support: HeartHandshake,
  location: MapPin,
};

function collectCustomAssetIds(values: HomepageIconValue[]): number[] {
  return [...new Set(values.filter((v): v is Extract<HomepageIconValue, { type: "custom" }> => v.type === "custom").map((v) => v.assetId))];
}

function toRenderable(
  value: HomepageIconValue,
  key: HomepageIconKey,
  assetsById: Map<number, { path: string; width: number | null; height: number | null }>
): RenderableIcon {
  if (value.type === "custom") {
    const asset = assetsById.get(value.assetId);
    if (asset) {
      return { type: "custom", src: asset.path, width: asset.width, height: asset.height };
    }
    // Stale reference (asset deleted out from under a saved setting,
    // which `deleteHomepageCustomIcon`'s reference guard should prevent
    // — defensive fallback only) — never a broken <img>.
    return { type: "lucide", Icon: HARDCODED_ICON_FALLBACKS[key] };
  }

  return { type: "lucide", Icon: getIconComponent(value.name, HARDCODED_ICON_FALLBACKS[key]) };
}

async function toRenderableMap(icons: HomepageIconMap): Promise<Record<HomepageIconKey, RenderableIcon>> {
  const keys = Object.keys(icons) as HomepageIconKey[];
  const assetIds = collectCustomAssetIds(keys.map((key) => icons[key]));
  const assetRows = await getHomepageCustomIconsByIds(assetIds);
  const assetsById = new Map(assetRows.map((row) => [row.id, { path: row.path, width: row.width, height: row.height }]));

  const entries = keys.map((key) => [key, toRenderable(icons[key], key, assetsById)] as const);
  return Object.fromEntries(entries) as Record<HomepageIconKey, RenderableIcon>;
}

/**
 * Hero Statistics + Why Choose Us — both read icons scoped to the
 * CURRENT PAGE's city context (`null` on the nationwide `/` homepage,
 * meaning the global row alone; a real city id on `/{citySeoUrl}`,
 * meaning that city's overrides layered over the global row). Cached per
 * request via React's `cache()`, same convention as every other
 * `lib/public/*.ts` resolver, so both sections sharing one page never
 * issue duplicate queries.
 */
export const getCachedPublicHomepageIconComponents = cache(async (cityId: number | null) => {
  const icons = await resolvePublicHomepageIcons(cityId);
  return toRenderableMap(icons);
});

/**
 * "Our Locations" grid's own need: each city CARD's icon is resolved
 * against THAT city's own id, never the viewing page's — see
 * `resolveLocationIconsForCities`'s own doc comment. Returns only the
 * `location` icon per city (the one key this section ever renders).
 */
export const getCachedLocationIconComponents = cache(async (cityIds: number[]) => {
  const byCity = await resolveLocationIconsForCities(cityIds);
  const cityIdsResolved = Object.keys(byCity).map(Number);

  const assetIds = collectCustomAssetIds(Object.values(byCity));
  const assetRows = await getHomepageCustomIconsByIds(assetIds);
  const assetsById = new Map(assetRows.map((row) => [row.id, { path: row.path, width: row.width, height: row.height }]));

  const entries = cityIdsResolved.map((cityId) => [cityId, toRenderable(byCity[cityId], "location", assetsById)] as const);
  return Object.fromEntries(entries) as Record<number, RenderableIcon>;
});
