import { z } from "zod";
import { isValidIconName } from "@/lib/icon-registry";

export const cityIdParamSchema = z.object({
  cityId: z.coerce.number().int().positive(),
});

/**
 * A single configured icon — a tagged union, never a bare string (see
 * `types/homepage-icon-settings.ts`'s `HomepageIconValue` for why). The
 * Lucide branch is rejected with a 400 before ever reaching the database
 * if `name` isn't in the static allowlist — the same gate
 * `getIconComponent` checks at render time. The custom branch only
 * checks `assetId` is a real positive integer here; whether it actually
 * references an existing `homepage_custom_icons` row is checked
 * service-side (`ensureCustomIconAssetsExist`), which needs a DB query
 * Zod can't do.
 */
const iconValueSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("lucide"), name: z.string().trim().min(1).refine(isValidIconName, "Unsupported icon") }),
  z.object({ type: z.literal("custom"), assetId: z.number().int().positive() }),
]);

/**
 * The Global row — every key required, mirrors `websiteThemeTokensSchema`'s
 * "whole payload always" convention exactly (see that validator's own doc
 * comment). Keys are written out literally (not derived from
 * `HOMEPAGE_ICON_KEYS` via `Object.fromEntries`) so `z.object()` infers a
 * precise, non-`Record<string, ...>` shape — TypeScript can't narrow a
 * dynamically-built shape object back to the exact key set without an
 * unsafe cast, so this trades a little duplication for zero `as`.
 */
export const updateGlobalHomepageIconsSchema = z.object({
  hero_specialities: iconValueSchema,
  hero_treatments: iconValueSchema,
  hero_doctors: iconValueSchema,
  hero_hospitals: iconValueSchema,
  why_verified_specialists: iconValueSchema,
  why_associated_hospitals: iconValueSchema,
  why_transparent_process: iconValueSchema,
  why_patient_first_support: iconValueSchema,
  location: iconValueSchema,
});

/** A City override row — every key optional AND nullable: `null` explicitly means "no override for this key, inherit global," `undefined`/omitted is treated identically (the client always resends the full current state — see the service's own doc comment, so there's no meaningful "leave unchanged" distinction to preserve here). */
export const updateCityHomepageIconOverridesSchema = z.object({
  hero_specialities: iconValueSchema.nullable().optional(),
  hero_treatments: iconValueSchema.nullable().optional(),
  hero_doctors: iconValueSchema.nullable().optional(),
  hero_hospitals: iconValueSchema.nullable().optional(),
  why_verified_specialists: iconValueSchema.nullable().optional(),
  why_associated_hospitals: iconValueSchema.nullable().optional(),
  why_transparent_process: iconValueSchema.nullable().optional(),
  why_patient_first_support: iconValueSchema.nullable().optional(),
  location: iconValueSchema.nullable().optional(),
});

export type UpdateGlobalHomepageIconsInput = z.infer<typeof updateGlobalHomepageIconsSchema>;
export type UpdateCityHomepageIconOverridesInput = z.infer<typeof updateCityHomepageIconOverridesSchema>;
export type CityIdParam = z.infer<typeof cityIdParamSchema>;
