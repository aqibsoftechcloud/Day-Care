"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Loader2, Plus, ShieldOff, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listCities } from "@/lib/api/cities";
import { getConsultationFormSettings, updateConsultationFormSettings } from "@/lib/api/consultation-form-settings";
import { notify } from "@/lib/toast";
import {
  CORE_FIELD_KEYS,
  CORE_FIELD_TYPES,
  DEFAULT_CONSULTATION_FORM_FIELDS,
  FIELD_KEY_PATTERN,
  MAX_CONSULTATION_FIELDS,
  MAX_POPULAR_CITIES,
  type ConsultationFieldType,
  type ConsultationFormField,
  type ConsultationFormSettings,
} from "@/types/consultation-form-settings";
import { updateConsultationFormSettingsSchema } from "@/validators/consultation-form-settings.validator";
import { cn } from "@/lib/utils";

const consultationFormSettingsKeys = { all: ["consultation-form-settings"] as const };
const citiesOptionsKey = ["consultation-form-settings", "cities"] as const;

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const FIELD_TYPE_LABELS: Record<ConsultationFieldType, string> = {
  text: "Text",
  email: "Email",
  phone: "Phone number",
  select: "Dropdown",
  textarea: "Text area",
  checkbox: "Checkbox",
};

const CUSTOM_TYPES: ConsultationFieldType[] = ["text", "email", "phone", "select", "textarea", "checkbox"];
const isCoreKey = (key: string) => (CORE_FIELD_KEYS as readonly string[]).includes(key);
/** These two make a lead reachable, so the server forbids removing/disabling/optional-ising them. */
const isLocked = (key: string) => key === "full_name" || key === "phone";

function slugifyValue(label: string) {
  return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "option";
}

function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function ConsultationFormSettingsPage() {
  const { canView, canUpdate } = usePermission();
  const hasViewAccess = canView("consultation-form-settings");
  const hasUpdateAccess = canUpdate("consultation-form-settings");
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ConsultationFormSettings | null>(null);
  // Keys added in this session and not yet saved — the only ones whose key may still be edited (saved keys are stable).
  const [unsavedKeys, setUnsavedKeys] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: consultationFormSettingsKeys.all,
    queryFn: () => getConsultationFormSettings(),
    enabled: hasViewAccess,
  });

  const citiesQuery = useQuery({
    queryKey: citiesOptionsKey,
    queryFn: () => listCities(),
    enabled: hasViewAccess,
    retry: false,
  });
  const activeCities = useMemo(
    () => (citiesQuery.data?.cities ?? []).filter((c) => c.status === "active").sort((a, b) => a.city_name.localeCompare(b.city_name)),
    [citiesQuery.data]
  );

  // Render-time state adjustment (not a `useEffect`) — see
  // app/dcs-panel/(protected)/website-appearance/page.tsx for why this
  // shape is used instead of an effect + setState pair.
  const [loadedSettings, setLoadedSettings] = useState<ConsultationFormSettings | null>(null);
  if (settingsQuery.data && loadedSettings !== settingsQuery.data.settings) {
    setLoadedSettings(settingsQuery.data.settings);
    setForm(settingsQuery.data.settings);
    setUnsavedKeys(new Set());
  }

  const saveMutation = useMutation({
    mutationFn: (data: ConsultationFormSettings) => updateConsultationFormSettings(data),
    onSuccess: (response) => {
      notify.success("Consultation form saved. Changes are now live on the public site.");
      queryClient.setQueryData(consultationFormSettingsKeys.all, response);
    },
    onError: (error) => notify.apiError(error, "Failed to save consultation form settings."),
  });

  const validation = useMemo(() => (form ? updateConsultationFormSettingsSchema.safeParse(form) : null), [form]);
  const issues = useMemo(() => {
    if (!validation || validation.success) return [];
    return validation.error.issues.map((issue) => {
      const index = issue.path[0] === "fields" && typeof issue.path[1] === "number" ? issue.path[1] : null;
      const fieldLabel = index !== null ? form?.fields[index]?.label : null;
      return { path: issue.path, message: fieldLabel ? `${fieldLabel}: ${issue.message}` : issue.message };
    });
  }, [validation, form]);

  if (!hasViewAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-6 py-20 text-center shadow-xs">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldOff className="size-5" aria-hidden="true" />
        </span>
        <p className="text-subtitle text-foreground">Access restricted</p>
        <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">
          You don&apos;t have permission to view Consultation Form Settings.
        </p>
      </div>
    );
  }

  const titleError = form && form.form_title.trim().length === 0 ? "Form title is required" : undefined;
  const descriptionError = form && form.form_description.trim().length === 0 ? "Form description is required" : undefined;
  const submitLabelError = form && form.submit_label.trim().length === 0 ? "Submit button label is required" : undefined;
  const hasErrors = Boolean(titleError || descriptionError || submitLabelError) || issues.length > 0;

  function patch(partial: Partial<ConsultationFormSettings>) {
    setForm((current) => (current ? { ...current, ...partial } : current));
  }

  function patchField(key: string, partial: Partial<ConsultationFormField>) {
    setForm((current) =>
      current ? { ...current, fields: current.fields.map((f) => (f.key === key ? { ...f, ...partial } : f)) } : current
    );
  }

  function changeFieldKey(oldKey: string, newKey: string) {
    patchField(oldKey, { key: newKey });
    setUnsavedKeys((current) => new Set([...current].map((k) => (k === oldKey ? newKey : k))));
    setExpanded((current) => (current === oldKey ? newKey : current));
  }

  function addField(kind: string) {
    if (!form) return;
    let field: ConsultationFormField;

    if (kind === "custom") {
      let n = form.fields.length + 1;
      while (form.fields.some((f) => f.key === `custom_${n}`)) n++;
      field = { key: `custom_${n}`, label: "New field", placeholder: "", type: "text", required: false, enabled: true, source: "none", options: [] };
    } else {
      const preset = DEFAULT_CONSULTATION_FORM_FIELDS.find((f) => f.key === kind);
      if (!preset) return;
      field = { ...preset, enabled: true };
    }

    patch({ fields: [...form.fields, field] });
    setUnsavedKeys((current) => new Set(current).add(field.key));
    setExpanded(field.key);
  }

  function removeField(key: string) {
    if (!form) return;
    patch({ fields: form.fields.filter((f) => f.key !== key) });
    setUnsavedKeys((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }

  function changeType(field: ConsultationFormField, type: ConsultationFieldType) {
    patchField(field.key, {
      type,
      source: type === "select" ? "manual" : "none",
      options: type === "select" ? (field.options.length > 0 ? field.options : [{ value: "option_1", label: "Option 1" }]) : [],
    });
  }

  const missingCoreFields = form
    ? DEFAULT_CONSULTATION_FORM_FIELDS.filter((preset) => !form.fields.some((f) => f.key === preset.key))
    : [];

  const selectedCities = form ? form.popular_city_ids : [];
  const availableCities = activeCities.filter((c) => !selectedCities.includes(c.id));

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Consultation Form Settings"
        description="Build the shared consultation / call-back form shown across the public website: its text, fields, dropdowns and popular-city buttons."
        action={
          hasUpdateAccess && (
            <Button onClick={() => form && saveMutation.mutate(form)} disabled={!form || hasErrors || saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {saveMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          )
        }
      />

      {settingsQuery.isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-20 text-body text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading…
        </div>
      )}

      {settingsQuery.isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-body-sm text-destructive">
          {settingsQuery.error instanceof ApiError ? settingsQuery.error.message : "Unable to load consultation form settings."}
        </div>
      )}

      {form && (
        <>
          {issues.length > 0 && (
            <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-body-sm text-destructive">
              <p className="font-medium">Fix these before saving:</p>
              <ul className="mt-1 list-disc pl-5">
                {issues.map((issue, i) => (
                  <li key={i}>{issue.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* A. General settings */}
          <section className="max-w-2xl rounded-xl border border-border bg-card p-5 shadow-xs" aria-labelledby="cf-general">
            <h2 id="cf-general" className="mb-4 text-subtitle text-foreground">General</h2>
            <div className="flex flex-col gap-5">
              <Field data-invalid={!!titleError || undefined}>
                <FieldLabel htmlFor="form-title">Form Title</FieldLabel>
                <Input id="form-title" value={form.form_title} onChange={(e) => patch({ form_title: e.target.value })} disabled={!hasUpdateAccess} maxLength={255} placeholder="Book FREE Consultation" />
                <FieldError errors={[titleError ? { message: titleError } : undefined]} />
              </Field>

              <Field data-invalid={!!descriptionError || undefined}>
                <FieldLabel htmlFor="form-description">Form Description</FieldLabel>
                <Textarea id="form-description" value={form.form_description} onChange={(e) => patch({ form_description: e.target.value })} disabled={!hasUpdateAccess} maxLength={500} rows={3} placeholder="Share your details and our team will call you back." />
                <FieldDescription>
                  Shown exactly as entered on every page the form appears on — no city, speciality or page-specific personalization is applied.
                </FieldDescription>
                <FieldError errors={[descriptionError ? { message: descriptionError } : undefined]} />
              </Field>

              <Field data-invalid={!!submitLabelError || undefined}>
                <FieldLabel htmlFor="form-submit-label">Submit Button Label</FieldLabel>
                <Input id="form-submit-label" value={form.submit_label} onChange={(e) => patch({ submit_label: e.target.value })} disabled={!hasUpdateAccess} maxLength={100} placeholder="Request a Call Back" />
                <FieldError errors={[submitLabelError ? { message: submitLabelError } : undefined]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="form-privacy">Privacy / Security Message <span className="text-muted-foreground">(optional)</span></FieldLabel>
                <Input id="form-privacy" value={form.privacy_message} onChange={(e) => patch({ privacy_message: e.target.value })} disabled={!hasUpdateAccess} maxLength={500} placeholder="Your information is 100% secure." />
                <FieldDescription>Small print shown under the submit button. Leave empty to hide it.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="form-country-code">Default Country Code</FieldLabel>
                <Input id="form-country-code" value={form.default_country_code} onChange={(e) => patch({ default_country_code: e.target.value.replace(/\D/g, "").slice(0, 4) })} disabled={!hasUpdateAccess} className="w-28" inputMode="numeric" />
                <FieldDescription>Digits only (e.g. 91). Preselected in the phone field&apos;s country dropdown.</FieldDescription>
              </Field>
            </div>
          </section>

          {/* B. Fields */}
          <section className="max-w-3xl rounded-xl border border-border bg-card p-5 shadow-xs" aria-labelledby="cf-fields">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 id="cf-fields" className="text-subtitle text-foreground">Fields</h2>
                <p className="text-body-sm text-muted-foreground">Shown in this order. Disabled fields are hidden and ignored on submit.</p>
              </div>
              {hasUpdateAccess && (
                <select
                  aria-label="Add a field"
                  className={cn(SELECT_CLASS, "w-48")}
                  value=""
                  disabled={form.fields.length >= MAX_CONSULTATION_FIELDS}
                  onChange={(e) => e.target.value && addField(e.target.value)}
                >
                  <option value="">+ Add field…</option>
                  <option value="custom">Custom field</option>
                  {missingCoreFields.map((preset) => (
                    <option key={preset.key} value={preset.key}>
                      {preset.label} (built-in)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <ol className="flex flex-col gap-3">
              {form.fields.map((field, index) => {
                const locked = isLocked(field.key);
                const core = isCoreKey(field.key);
                const open = expanded === field.key;
                const fieldIssues = issues.filter((i) => i.path[0] === "fields" && i.path[1] === index);

                return (
                  <li key={field.key} className={cn("rounded-lg border bg-background", fieldIssues.length > 0 ? "border-destructive/50" : "border-border", !field.enabled && "opacity-60")}>
                    <div className="flex flex-wrap items-center gap-2 p-3">
                      <div className="flex flex-col">
                        <Button type="button" variant="ghost" size="icon" className="size-6" aria-label={`Move ${field.label} up`} disabled={!hasUpdateAccess || index === 0} onClick={() => patch({ fields: move(form.fields, index, -1) })}>
                          <ArrowUp className="size-3.5" aria-hidden="true" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="size-6" aria-label={`Move ${field.label} down`} disabled={!hasUpdateAccess || index === form.fields.length - 1} onClick={() => patch({ fields: move(form.fields, index, 1) })}>
                          <ArrowDown className="size-3.5" aria-hidden="true" />
                        </Button>
                      </div>

                      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setExpanded(open ? null : field.key)} aria-expanded={open}>
                        <span className="block truncate text-body font-medium text-foreground">{field.label || "(no label)"}</span>
                        <span className="block truncate text-caption text-muted-foreground">
                          {FIELD_TYPE_LABELS[field.type]}
                          {field.source === "treatments" && " · treatments"}
                          {field.source === "cities" && " · active cities"}
                          {field.source === "manual" && ` · ${field.options.length} option(s)`}
                          {" · "}
                          <code>{field.key}</code>
                          {core && " · built-in"}
                        </span>
                      </button>

                      <label className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
                        Required
                        <Switch checked={field.required} disabled={!hasUpdateAccess || locked} onCheckedChange={(checked) => patchField(field.key, { required: checked })} aria-label={`${field.label} required`} />
                      </label>
                      <label className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
                        Enabled
                        <Switch checked={field.enabled} disabled={!hasUpdateAccess || locked} onCheckedChange={(checked) => patchField(field.key, { enabled: checked })} aria-label={`${field.label} enabled`} />
                      </label>
                      <Button type="button" variant="ghost" size="icon" aria-label={open ? "Collapse" : "Edit field"} onClick={() => setExpanded(open ? null : field.key)}>
                        {open ? <ChevronUp className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
                      </Button>
                      {hasUpdateAccess && !locked && (
                        <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${field.label}`} onClick={() => removeField(field.key)}>
                          <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                        </Button>
                      )}
                    </div>

                    {open && (
                      <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor={`label-${field.key}`}>Label</FieldLabel>
                          <Input id={`label-${field.key}`} value={field.label} maxLength={120} disabled={!hasUpdateAccess} onChange={(e) => patchField(field.key, { label: e.target.value })} />
                        </Field>

                        {field.type !== "checkbox" && (
                          <Field>
                            <FieldLabel htmlFor={`ph-${field.key}`}>Placeholder</FieldLabel>
                            <Input id={`ph-${field.key}`} value={field.placeholder} maxLength={150} disabled={!hasUpdateAccess} onChange={(e) => patchField(field.key, { placeholder: e.target.value })} />
                          </Field>
                        )}

                        <Field>
                          <FieldLabel htmlFor={`key-${field.key}`}>Field key</FieldLabel>
                          <Input
                            id={`key-${field.key}`}
                            value={field.key}
                            maxLength={40}
                            disabled={!hasUpdateAccess || !unsavedKeys.has(field.key) || core}
                            aria-invalid={!FIELD_KEY_PATTERN.test(field.key) || undefined}
                            onChange={(e) => changeFieldKey(field.key, e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                          />
                          <FieldDescription>
                            {core
                              ? "Built-in key — fixed."
                              : unsavedKeys.has(field.key)
                                ? "Lowercase letters, numbers, underscores. Cannot be changed after saving."
                                : "Stable identifier used to store answers — it can't change once saved."}
                          </FieldDescription>
                        </Field>

                        <Field>
                          <FieldLabel htmlFor={`type-${field.key}`}>Type</FieldLabel>
                          <select
                            id={`type-${field.key}`}
                            className={SELECT_CLASS}
                            value={field.type}
                            disabled={!hasUpdateAccess || core || !unsavedKeys.has(field.key)}
                            onChange={(e) => changeType(field, e.target.value as ConsultationFieldType)}
                          >
                            {(core ? [CORE_FIELD_TYPES[field.key as keyof typeof CORE_FIELD_TYPES].type] : CUSTOM_TYPES).map((type) => (
                              <option key={type} value={type}>{FIELD_TYPE_LABELS[type]}</option>
                            ))}
                          </select>
                          {!core && !unsavedKeys.has(field.key) && <FieldDescription>Type is fixed once saved so earlier answers stay meaningful.</FieldDescription>}
                        </Field>

                        {field.type === "select" && field.source === "treatments" && (
                          <p className="text-body-sm text-muted-foreground sm:col-span-2">
                            Options come from your treatments automatically: global treatments when no city is chosen, and that city&apos;s own treatments once a city is picked.
                          </p>
                        )}
                        {field.type === "select" && field.source === "cities" && (
                          <p className="text-body-sm text-muted-foreground sm:col-span-2">Options are your active cities. The visitor&apos;s choice is stored by city ID.</p>
                        )}

                        {field.type === "select" && field.source === "manual" && (
                          <div className="flex flex-col gap-2 sm:col-span-2">
                            <FieldLabel>Options</FieldLabel>
                            {field.options.map((option, optionIndex) => (
                              <div key={option.value} className="flex items-center gap-2">
                                <Input
                                  aria-label={`Option ${optionIndex + 1} label`}
                                  value={option.label}
                                  maxLength={150}
                                  disabled={!hasUpdateAccess}
                                  onChange={(e) =>
                                    patchField(field.key, { options: field.options.map((o, i) => (i === optionIndex ? { ...o, label: e.target.value } : o)) })
                                  }
                                />
                                <Button type="button" variant="ghost" size="icon" aria-label="Move option up" disabled={optionIndex === 0 || !hasUpdateAccess} onClick={() => patchField(field.key, { options: move(field.options, optionIndex, -1) })}>
                                  <ArrowUp className="size-4" aria-hidden="true" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" aria-label="Remove option" disabled={!hasUpdateAccess} onClick={() => patchField(field.key, { options: field.options.filter((_, i) => i !== optionIndex) })}>
                                  <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                                </Button>
                              </div>
                            ))}
                            {hasUpdateAccess && field.options.length < 50 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-fit"
                                onClick={() => {
                                  const label = `Option ${field.options.length + 1}`;
                                  let value = slugifyValue(label);
                                  while (field.options.some((o) => o.value === value)) value += "_";
                                  patchField(field.key, { options: [...field.options, { value, label }] });
                                }}
                              >
                                <Plus className="size-4" aria-hidden="true" /> Add option
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          {/* C. Popular cities */}
          <section className="max-w-3xl rounded-xl border border-border bg-card p-5 shadow-xs" aria-labelledby="cf-popular">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 id="cf-popular" className="text-subtitle text-foreground">Popular City Buttons</h2>
                <p className="text-body-sm text-muted-foreground">Quick-select buttons shown under the City dropdown. Requires the City field to be enabled.</p>
              </div>
              <Switch checked={form.show_popular_cities} disabled={!hasUpdateAccess} onCheckedChange={(checked) => patch({ show_popular_cities: checked })} aria-label="Show popular city buttons" />
            </div>

            {citiesQuery.isError && (
              <p className="text-body-sm text-muted-foreground">
                The list of cities couldn&apos;t be loaded (this needs permission to view Cities), so popular cities can&apos;t be edited here.
              </p>
            )}

            {form.show_popular_cities && !citiesQuery.isError && (
              <div className="flex flex-col gap-2">
                {selectedCities.length === 0 && <p className="text-body-sm text-muted-foreground">No cities selected yet.</p>}
                {selectedCities.map((cityId, index) => {
                  const city = activeCities.find((c) => c.id === cityId);
                  return (
                    <div key={cityId} className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5">
                      <span className="flex-1 text-body">
                        {city ? city.city_name : `City #${cityId}`}
                        {!city && !citiesQuery.isLoading && <span className="ml-2 text-caption text-destructive">inactive or deleted — hidden on the site</span>}
                      </span>
                      <Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={index === 0 || !hasUpdateAccess} onClick={() => patch({ popular_city_ids: move(selectedCities, index, -1) })}>
                        <ArrowUp className="size-4" aria-hidden="true" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" aria-label="Move down" disabled={index === selectedCities.length - 1 || !hasUpdateAccess} onClick={() => patch({ popular_city_ids: move(selectedCities, index, 1) })}>
                        <ArrowDown className="size-4" aria-hidden="true" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" aria-label="Remove city" disabled={!hasUpdateAccess} onClick={() => patch({ popular_city_ids: selectedCities.filter((id) => id !== cityId) })}>
                        <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                      </Button>
                    </div>
                  );
                })}
                {hasUpdateAccess && selectedCities.length < MAX_POPULAR_CITIES && availableCities.length > 0 && (
                  <select
                    aria-label="Add a popular city"
                    className={cn(SELECT_CLASS, "w-56")}
                    value=""
                    onChange={(e) => e.target.value && patch({ popular_city_ids: [...selectedCities, Number(e.target.value)] })}
                  >
                    <option value="">+ Add city…</option>
                    {availableCities.map((city) => (
                      <option key={city.id} value={city.id}>{city.city_name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
