import { prisma } from "@/lib/prisma";
import { DEFAULT_WEBSITE_THEME_TOKENS, type WebsiteThemeTokens } from "@/types/website-theme";
import type { UpdateWebsiteThemeInput } from "@/validators/website-theme.validator";

/**
 * Single-row convention (always id=1), matching how ai_configurations
 * enforces its own "only one is_active row" invariant in the service
 * layer rather than a DB constraint — there is no legitimate second row
 * here, so every read/write targets id=1 directly.
 */
const SETTINGS_ROW_ID = 1;

/**
 * Merges the stored tokens over the defaults rather than returning the
 * stored JSON verbatim — if a future code change adds a new token key,
 * an older saved row (written before that key existed) still resolves to
 * a sane default for it instead of `undefined` breaking the UI/CSS
 * output.
 */
function mergeWithDefaults(stored: unknown): WebsiteThemeTokens {
  if (typeof stored !== "object" || stored === null) {
    return { ...DEFAULT_WEBSITE_THEME_TOKENS };
  }

  return { ...DEFAULT_WEBSITE_THEME_TOKENS, ...(stored as Partial<WebsiteThemeTokens>) };
}

export async function getWebsiteTheme(): Promise<WebsiteThemeTokens> {
  const row = await prisma.website_theme_settings.findUnique({
    where: { id: SETTINGS_ROW_ID },
    select: { tokens: true },
  });

  if (!row) {
    return { ...DEFAULT_WEBSITE_THEME_TOKENS };
  }

  return mergeWithDefaults(row.tokens);
}

export async function updateWebsiteTheme(tokens: UpdateWebsiteThemeInput): Promise<WebsiteThemeTokens> {
  await prisma.website_theme_settings.upsert({
    where: { id: SETTINGS_ROW_ID },
    create: { id: SETTINGS_ROW_ID, tokens },
    update: { tokens, updated_at: new Date() },
  });

  return tokens;
}

export async function resetWebsiteTheme(): Promise<WebsiteThemeTokens> {
  return updateWebsiteTheme({ ...DEFAULT_WEBSITE_THEME_TOKENS });
}
