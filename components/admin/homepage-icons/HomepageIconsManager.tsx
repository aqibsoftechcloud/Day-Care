"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { IconPicker } from "@/components/admin/homepage-icons/IconPicker";
import { homepageIconSettingsKeys } from "@/components/admin/homepage-icons/queries";
import { ApiError } from "@/lib/api/client";
import { listCities } from "@/lib/api/cities";
import {
  getCityHomepageIconOverrides,
  getGlobalHomepageIcons,
  resetCityHomepageIconOverrides,
  resetGlobalHomepageIcons,
  updateCityHomepageIconOverrides,
  updateGlobalHomepageIcons,
} from "@/lib/api/homepage-icon-settings";
import { notify } from "@/lib/toast";
import type { HomepageIconKey, HomepageIconMap, HomepageIconValue } from "@/types/homepage-icon-settings";

type IconSectionTab = "hero" | "why" | "locations";

const ICON_SECTIONS: { tab: IconSectionTab; label: string; items: { key: HomepageIconKey; label: string }[] }[] = [
  {
    tab: "hero",
    label: "Hero Statistics",
    items: [
      { key: "hero_specialities", label: "Specialities" },
      { key: "hero_treatments", label: "Treatments" },
      { key: "hero_doctors", label: "Doctors" },
      { key: "hero_hospitals", label: "Hospitals" },
    ],
  },
  {
    tab: "why",
    label: "Why Choose Us",
    items: [
      { key: "why_verified_specialists", label: "Verified Specialists" },
      { key: "why_associated_hospitals", label: "Associated Hospitals" },
      { key: "why_transparent_process", label: "Transparent Process" },
      { key: "why_patient_first_support", label: "Patient-First Support" },
    ],
  },
  {
    tab: "locations",
    label: "Our Locations",
    items: [{ key: "location", label: "Location Card Icon (applies to this city's own card, shown on every homepage)" }],
  },
];

type HomepageIconsManagerProps = {
  canUpdate: boolean;
};

export function HomepageIconsManager({ canUpdate }: HomepageIconsManagerProps) {
  const [scope, setScope] = useState<"global" | "city">("global");
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [sectionTab, setSectionTab] = useState<IconSectionTab>("hero");

  const citiesQuery = useQuery({ queryKey: ["cities", "homepage-icons-picker"], queryFn: () => listCities() });
  const cities = citiesQuery.data?.cities ?? [];

  // Derived, not synced via effect: no state write happens just because
  // the city list loaded — `effectiveCityId` simply falls back to the
  // first city until the admin explicitly picks one (or the list is
  // still empty/loading), and `onValueChange` is the only place
  // `selectedCityId` itself is ever set.
  const effectiveCityId = selectedCityId ?? cities[0]?.id ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
        <Field className="max-w-60">
          <FieldLabel htmlFor="homepage-icons-scope">Configuration</FieldLabel>
          <Select value={scope} onValueChange={(value) => setScope(value as "global" | "city")}>
            <SelectTrigger id="homepage-icons-scope" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global Defaults</SelectItem>
              <SelectItem value="city">City-Specific Override</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {scope === "city" && (
          <Field className="max-w-60">
            <FieldLabel htmlFor="homepage-icons-city">City</FieldLabel>
            <Select
              value={effectiveCityId !== null ? String(effectiveCityId) : ""}
              onValueChange={(value) => setSelectedCityId(Number(value))}
              disabled={citiesQuery.isLoading}
            >
              <SelectTrigger id="homepage-icons-city" className="w-full">
                <SelectValue placeholder={citiesQuery.isLoading ? "Loading…" : "Select a city"} />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={String(city.id)}>
                    {city.city_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        <p className="ml-auto max-w-md text-body-sm text-muted-foreground">
          {scope === "global"
            ? "These icons are used on the nationwide homepage (/) and as the fallback for every city that hasn't set its own override."
            : "Override icons for this city's homepage only. Any icon left unset here keeps inheriting the current global default."}
        </p>
      </div>

      <Tabs value={sectionTab} onValueChange={(value) => setSectionTab(value as IconSectionTab)}>
        <TabsList className="grid w-full grid-cols-3 sm:w-fit sm:inline-grid">
          {ICON_SECTIONS.map((section) => (
            <TabsTrigger key={section.tab} value={section.tab} className="min-w-0">
              <span className="truncate">{section.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {ICON_SECTIONS.map((section) => (
          <TabsContent key={section.tab} value={section.tab} className="pt-4">
            {scope === "global" ? (
              <GlobalIconSection items={section.items} canUpdate={canUpdate} />
            ) : effectiveCityId !== null ? (
              <CityIconSection key={effectiveCityId} cityId={effectiveCityId} items={section.items} canUpdate={canUpdate} />
            ) : (
              <p className="text-body-sm text-muted-foreground">Select a city to configure its overrides.</p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

/**
 * Selecting an icon in `IconPicker` updates local `draft` state immediately
 * (so the trigger shows the new icon right away) but does NOT persist
 * anything — only the "Save Changes" button does. That gap is easy to miss:
 * the trigger already looks "done" the moment an icon is picked, so a
 * closed tab/refresh before clicking Save silently discards the change
 * with no error, no failed request, nothing to debug. This is a
 * browser-native safety net for exactly that moment, not a fix for any
 * data-corruption bug in the save path itself.
 */
function useWarnOnUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);
}

function IconRowShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {children}
    </div>
  );
}

/**
 * Outer wrapper: owns the fetch, loading, and error states only. Mounts
 * `GlobalIconForm` (keyed by whether data has arrived) once real data
 * exists, so the form's own local `draft` state can initialize directly
 * from a prop via `useState(initialIcons)` — no effect syncing fetched
 * data into state, which `react-hooks/set-state-in-effect` flags as a
 * cascading-render risk. Same "Body owns the query, Form owns the local
 * draft" split already used by `DoctorFormBody`/`DoctorForm` and
 * `GlobalTreatmentFormBody`/`GlobalTreatmentForm` elsewhere in this admin.
 */
function GlobalIconSection({
  items,
  canUpdate,
}: {
  items: { key: HomepageIconKey; label: string }[];
  canUpdate: boolean;
}) {
  const query = useQuery({ queryKey: homepageIconSettingsKeys.global, queryFn: getGlobalHomepageIcons });

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {query.error instanceof ApiError ? query.error.message : "Failed to load global homepage icons."}
      </p>
    );
  }

  return <GlobalIconForm items={items} canUpdate={canUpdate} initial={query.data.icons} />;
}

function GlobalIconForm({
  items,
  canUpdate,
  initial,
}: {
  items: { key: HomepageIconKey; label: string }[];
  canUpdate: boolean;
  initial: HomepageIconMap;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<HomepageIconMap>(initial);

  const saveMutation = useMutation({
    mutationFn: (icons: HomepageIconMap) => updateGlobalHomepageIcons(icons),
    onSuccess: (data) => {
      notify.success("Global homepage icons saved.");
      setDraft(data.icons);
      queryClient.setQueryData(homepageIconSettingsKeys.global, data);
      queryClient.invalidateQueries({ queryKey: ["homepage-icon-settings"] });
    },
    onError: (error) => notify.apiError(error),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetGlobalHomepageIcons(),
    onSuccess: (data) => {
      notify.success("Global homepage icons reset to the original defaults.");
      setDraft(data.icons);
      queryClient.setQueryData(homepageIconSettingsKeys.global, data);
      queryClient.invalidateQueries({ queryKey: ["homepage-icon-settings"] });
    },
    onError: (error) => notify.apiError(error),
  });

  const isDirty = JSON.stringify(draft) !== JSON.stringify(initial);
  useWarnOnUnsavedChanges(isDirty);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <IconRowShell key={item.key} label={item.label}>
            <div className="w-full sm:w-64">
              <IconPicker
                id={`global-icon-${item.key}`}
                value={draft[item.key]}
                disabled={!canUpdate || saveMutation.isPending || resetMutation.isPending}
                onChange={(value) => setDraft((prev) => ({ ...prev, [item.key]: value }))}
              />
            </div>
          </IconRowShell>
        ))}
      </div>

      {canUpdate && (
        <div className="flex items-center justify-end gap-3">
          {isDirty && (
            <p className="text-body-sm font-medium text-amber-600 dark:text-amber-500">Unsaved changes — click Save to apply them.</p>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => resetMutation.mutate()}
            disabled={saveMutation.isPending || resetMutation.isPending}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset to Original Defaults
          </Button>
          <LoadingButton
            type="button"
            onClick={() => saveMutation.mutate(draft)}
            disabled={!isDirty || resetMutation.isPending}
            loading={saveMutation.isPending}
          >
            Save Changes
          </LoadingButton>
        </div>
      )}
    </div>
  );
}

type CityDraftRow = { overridden: boolean; value: HomepageIconValue };
type CityDraft = Record<HomepageIconKey, CityDraftRow>;

/** Outer wrapper: query/loading/error only — see `GlobalIconSection`'s own doc comment for why this split exists. */
function CityIconSection({
  cityId,
  items,
  canUpdate,
}: {
  cityId: number;
  items: { key: HomepageIconKey; label: string }[];
  canUpdate: boolean;
}) {
  const query = useQuery({
    queryKey: homepageIconSettingsKeys.city(cityId),
    queryFn: () => getCityHomepageIconOverrides(cityId),
  });

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {query.error instanceof ApiError ? query.error.message : "Failed to load this city's icon overrides."}
      </p>
    );
  }

  return (
    <CityIconForm
      cityId={cityId}
      items={items}
      canUpdate={canUpdate}
      global={query.data.global}
      initialOverrides={query.data.overrides}
    />
  );
}

function buildCityDraft(global: HomepageIconMap, overrides: Record<string, HomepageIconValue | null | undefined>): CityDraft {
  const draft = {} as CityDraft;
  for (const key of Object.keys(global) as HomepageIconKey[]) {
    const overrideValue = overrides[key];
    draft[key] = overrideValue
      ? { overridden: true, value: overrideValue }
      : { overridden: false, value: global[key] };
  }
  return draft;
}

function CityIconForm({
  cityId,
  items,
  canUpdate,
  global,
  initialOverrides,
}: {
  cityId: number;
  items: { key: HomepageIconKey; label: string }[];
  canUpdate: boolean;
  global: HomepageIconMap;
  initialOverrides: Record<string, HomepageIconValue | null | undefined>;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<CityDraft>(() => buildCityDraft(global, initialOverrides));

  const saveMutation = useMutation({
    mutationFn: (payload: Record<HomepageIconKey, HomepageIconValue | null>) => updateCityHomepageIconOverrides(cityId, payload),
    onSuccess: (data) => {
      notify.success("City icon overrides saved.");
      setDraft(buildCityDraft(global, data.overrides));
      queryClient.invalidateQueries({ queryKey: homepageIconSettingsKeys.city(cityId) });
      queryClient.invalidateQueries({ queryKey: ["homepage-icon-settings"] });
    },
    onError: (error) => notify.apiError(error),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetCityHomepageIconOverrides(cityId),
    onSuccess: (data) => {
      notify.success("This city's overrides were reset — it now inherits the global defaults again.");
      setDraft(buildCityDraft(global, data.overrides));
      queryClient.invalidateQueries({ queryKey: homepageIconSettingsKeys.city(cityId) });
      queryClient.invalidateQueries({ queryKey: ["homepage-icon-settings"] });
    },
    onError: (error) => notify.apiError(error),
  });

  const initialDraft = useMemo(() => buildCityDraft(global, initialOverrides), [global, initialOverrides]);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft);
  const hasAnyOverride = Object.values(draft).some((row) => row.overridden);
  useWarnOnUnsavedChanges(isDirty);

  const handleSave = () => {
    const payload = {} as Record<HomepageIconKey, HomepageIconValue | null>;
    for (const key of Object.keys(draft) as HomepageIconKey[]) {
      payload[key] = draft[key].overridden ? draft[key].value : null;
    }
    saveMutation.mutate(payload);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const row = draft[item.key];
          return (
            <div key={item.key} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-helper">
                    {row.overridden ? "Custom icon for this city" : "Inherited from the global default"}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-body-sm text-muted-foreground">Custom</span>
                  <Switch
                    checked={row.overridden}
                    disabled={!canUpdate || saveMutation.isPending || resetMutation.isPending}
                    onCheckedChange={(checked) =>
                      setDraft((prev) => ({ ...prev, [item.key]: { overridden: checked, value: row.value } }))
                    }
                  />
                </div>
              </div>

              <div className="w-full sm:w-64">
                <IconPicker
                  id={`city-${cityId}-icon-${item.key}`}
                  value={row.value}
                  disabled={!canUpdate || !row.overridden || saveMutation.isPending || resetMutation.isPending}
                  onChange={(value) => setDraft((prev) => ({ ...prev, [item.key]: { overridden: true, value } }))}
                />
              </div>
            </div>
          );
        })}
      </div>

      {canUpdate && (
        <div className="flex items-center justify-end gap-3">
          {isDirty && (
            <p className="text-body-sm font-medium text-amber-600 dark:text-amber-500">Unsaved changes — click Save to apply them.</p>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => resetMutation.mutate()}
            disabled={!hasAnyOverride || saveMutation.isPending || resetMutation.isPending}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset All Overrides for This City
          </Button>
          <LoadingButton
            type="button"
            onClick={handleSave}
            disabled={!isDirty || resetMutation.isPending}
            loading={saveMutation.isPending}
          >
            Save Changes
          </LoadingButton>
        </div>
      )}
    </div>
  );
}
