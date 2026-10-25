"use client";

import { useState } from "react";
import { Loader2, RotateCcw, ShieldOff } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { ColorField } from "@/components/admin/website-appearance/ColorField";
import { Button } from "@/components/ui/button";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { getWebsiteTheme, resetWebsiteTheme, updateWebsiteTheme } from "@/lib/api/website-theme";
import { notify } from "@/lib/toast";
import { DEFAULT_WEBSITE_THEME_TOKENS, WEBSITE_THEME_TOKEN_GROUPS, type WebsiteThemeTokens } from "@/types/website-theme";

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

const websiteThemeKeys = { all: ["website-theme"] as const };

export default function WebsiteAppearancePage() {
  const { canView, canUpdate } = usePermission();
  const hasViewAccess = canView("website-appearance");
  const hasUpdateAccess = canUpdate("website-appearance");
  const queryClient = useQueryClient();

  const [tokens, setTokens] = useState<WebsiteThemeTokens | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const themeQuery = useQuery({
    queryKey: websiteThemeKeys.all,
    queryFn: () => getWebsiteTheme(),
    enabled: hasViewAccess,
  });

  // Seeds local editable state from the fetched/saved record — React's
  // documented "adjusting state when a prop changes" render-time pattern
  // (tracked via state, not a ref — refs can't be read during render
  // under this project's React Compiler rules), not a `useEffect`, so it
  // never causes the extra "effect ran, now re-render" cascade a
  // `useEffect` + `setState` pair would.
  const [loadedTokens, setLoadedTokens] = useState<WebsiteThemeTokens | null>(null);
  if (themeQuery.data && loadedTokens !== themeQuery.data.tokens) {
    setLoadedTokens(themeQuery.data.tokens);
    setTokens(themeQuery.data.tokens);
  }

  const saveMutation = useMutation({
    mutationFn: (data: WebsiteThemeTokens) => updateWebsiteTheme(data),
    onSuccess: (response) => {
      notify.success("Website appearance saved. Changes are now live across the public site.");
      queryClient.setQueryData(websiteThemeKeys.all, response);
      // Set local form state directly rather than relying solely on the
      // render-time query-cache sync above picking up this new reference
      // on the next render — that path exists for the initial load (no
      // mutation has fired yet to call this), but a mutation's `onSuccess`
      // already has the authoritative new value in hand right here, so
      // there's no reason to route the form's own fields through an extra
      // render-cycle indirection to reflect it.
      setLoadedTokens(response.tokens);
      setTokens(response.tokens);
    },
    onError: (error) => notify.apiError(error, "Failed to save website appearance."),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetWebsiteTheme(),
    onSuccess: (response) => {
      notify.success("Website appearance reset to defaults.");
      queryClient.setQueryData(websiteThemeKeys.all, response);
      setLoadedTokens(response.tokens);
      setTokens(response.tokens);
      setResetConfirmOpen(false);
    },
    onError: (error) => notify.apiError(error, "Failed to reset website appearance."),
  });

  if (!hasViewAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-6 py-20 text-center shadow-xs">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldOff className="size-5" aria-hidden="true" />
        </span>
        <p className="text-subtitle text-foreground">Access restricted</p>
        <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">
          You don&apos;t have permission to view Website Appearance.
        </p>
      </div>
    );
  }

  const errors: Partial<Record<keyof WebsiteThemeTokens, string>> = {};
  if (tokens) {
    for (const key of Object.keys(tokens) as (keyof WebsiteThemeTokens)[]) {
      if (!HEX_PATTERN.test(tokens[key])) {
        errors[key] = "Must be a 6-digit hex color, e.g. #00283b";
      }
    }
  }
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Website Appearance"
        description="Centralized design tokens for the public website — one consistent brand identity, controlled from here."
        action={
          hasUpdateAccess && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setResetConfirmOpen(true)} disabled={saveMutation.isPending}>
                <RotateCcw className="size-4" aria-hidden="true" />
                Reset to Default
              </Button>
              <Button
                onClick={() => tokens && saveMutation.mutate(tokens)}
                disabled={!tokens || hasErrors || saveMutation.isPending}
              >
                {saveMutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {saveMutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          )
        }
      />

      {themeQuery.isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-20 text-body text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading…
        </div>
      )}

      {themeQuery.isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-body-sm text-destructive">
          {themeQuery.error instanceof ApiError ? themeQuery.error.message : "Unable to load website appearance."}
        </div>
      )}

      {tokens && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="flex flex-col gap-6">
            {WEBSITE_THEME_TOKEN_GROUPS.map((group) => (
              <div key={group.key} className="rounded-xl border border-border bg-card p-5 shadow-xs">
                <FieldSet disabled={!hasUpdateAccess}>
                  <FieldLegend>{group.label}</FieldLegend>
                  <p className="-mt-3 text-body-sm text-muted-foreground">{group.description}</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {group.tokens.map(({ key, label }) => (
                      <ColorField
                        key={key}
                        label={label}
                        value={tokens[key]}
                        error={errors[key]}
                        onChange={(value) => setTokens({ ...tokens, [key]: value })}
                      />
                    ))}
                  </div>
                </FieldSet>
              </div>
            ))}
          </div>

          <div className="lg:sticky lg:top-6 lg:h-fit">
            <LivePreview tokens={tokens} />
          </div>
        </div>
      )}

      <DeleteConfirmDialog
        open={resetConfirmOpen}
        title="Reset to default appearance?"
        description="This restores every color below to the site's original production values. Your current customizations will be lost."
        confirmLabel="Reset to Default"
        loading={resetMutation.isPending}
        onConfirm={() => resetMutation.mutate()}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </div>
  );
}

/** Simple, non-exhaustive live preview — heading/paragraph, primary + secondary buttons, a hero sample, a card sample, and a CTA sample, each built directly from the in-progress (unsaved) token values. */
function LivePreview({ tokens }: { tokens: WebsiteThemeTokens }) {
  const safe = (value: string, fallback: string) => (HEX_PATTERN.test(value) ? value : fallback);
  const t = {
    heroBackground: safe(tokens.heroBackground, DEFAULT_WEBSITE_THEME_TOKENS.heroBackground),
    heroHeading: safe(tokens.heroHeading, DEFAULT_WEBSITE_THEME_TOKENS.heroHeading),
    heroEyebrow: safe(tokens.heroEyebrow, DEFAULT_WEBSITE_THEME_TOKENS.heroEyebrow),
    ctaPrimaryBackground: safe(tokens.ctaPrimaryBackground, DEFAULT_WEBSITE_THEME_TOKENS.ctaPrimaryBackground),
    ctaPrimaryText: safe(tokens.ctaPrimaryText, DEFAULT_WEBSITE_THEME_TOKENS.ctaPrimaryText),
    ctaSecondaryBorder: safe(tokens.ctaSecondaryBorder, DEFAULT_WEBSITE_THEME_TOKENS.ctaSecondaryBorder),
    ctaSecondaryText: safe(tokens.ctaSecondaryText, DEFAULT_WEBSITE_THEME_TOKENS.ctaSecondaryText),
    cardBackground: safe(tokens.cardBackground, DEFAULT_WEBSITE_THEME_TOKENS.cardBackground),
    cardBorder: safe(tokens.cardBorder, DEFAULT_WEBSITE_THEME_TOKENS.cardBorder),
    textHeading: safe(tokens.textHeading, DEFAULT_WEBSITE_THEME_TOKENS.textHeading),
    textBody: safe(tokens.textBody, DEFAULT_WEBSITE_THEME_TOKENS.textBody),
    bgPage: safe(tokens.bgPage, DEFAULT_WEBSITE_THEME_TOKENS.bgPage),
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-xs">
      <p className="text-section-title text-foreground">Live Preview</p>

      <div className="overflow-hidden rounded-lg" style={{ backgroundColor: t.heroBackground }}>
        <div className="flex flex-col gap-2 p-5">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: t.heroEyebrow }}>
            Eyebrow Label
          </span>
          <p className="text-xl font-black" style={{ color: t.heroHeading }}>
            Hero Heading Sample
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className="rounded-md px-3 py-1.5 text-sm font-semibold"
              style={{ backgroundColor: t.ctaPrimaryBackground, color: t.ctaPrimaryText }}
            >
              Primary Button
            </span>
            <span
              className="rounded-md border px-3 py-1.5 text-sm font-semibold"
              style={{ borderColor: t.ctaSecondaryBorder, color: t.ctaSecondaryText }}
            >
              Secondary Button
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg p-4" style={{ backgroundColor: t.bgPage }}>
        <div className="rounded-lg border p-4" style={{ backgroundColor: t.cardBackground, borderColor: t.cardBorder }}>
          <p className="text-base font-semibold" style={{ color: t.textHeading }}>
            Card Heading Sample
          </p>
          <p className="mt-1 text-sm" style={{ color: t.textBody }}>
            Card body text renders in the neutral text-body color, independent of the brand hero colors above.
          </p>
        </div>
      </div>
    </div>
  );
}
