"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, ShieldOff, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePermission } from "@/hooks/usePermission";
import { getContactPageSettings, updateContactPageSettings } from "@/lib/api/contact-page-settings";
import { notify } from "@/lib/toast";
import {
  CONTACT_ICON_KEYS,
  CONTACT_ICON_LABELS,
  MAX_CONTACT_ITEMS,
  type ContactIconKey,
  type ContactItem,
  type ContactPageSettings,
} from "@/types/contact-page-settings";
import { updateContactPageSettingsSchema } from "@/validators/contact-page-settings.validator";

const contactPageSettingsKeys = { all: ["contact-page-settings"] as const };

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const ITEM_PRESETS: Record<ContactIconKey, string> = {
  email: "Email:",
  phone: "Phone:",
  location: "Location:",
  clock: "Opening hours:",
  globe: "Website:",
  message: "Message:",
};

function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function ContactPageSettingsPage() {
  const { canView, canUpdate } = usePermission();
  const hasViewAccess = canView("contact-page-settings");
  const hasUpdateAccess = canUpdate("contact-page-settings");
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ContactPageSettings | null>(null);

  const settingsQuery = useQuery({
    queryKey: contactPageSettingsKeys.all,
    queryFn: () => getContactPageSettings(),
    enabled: hasViewAccess,
  });

  // Render-time state adjustment instead of an effect — same shape as the Consultation Form Settings page.
  const [loadedSettings, setLoadedSettings] = useState<ContactPageSettings | null>(null);
  if (settingsQuery.data && loadedSettings !== settingsQuery.data.settings) {
    setLoadedSettings(settingsQuery.data.settings);
    setForm(settingsQuery.data.settings);
  }

  const saveMutation = useMutation({
    mutationFn: (data: ContactPageSettings) => updateContactPageSettings(data),
    onSuccess: (response) => {
      notify.success("Contact page saved. Changes are now live on the public site.");
      queryClient.setQueryData(contactPageSettingsKeys.all, response);
    },
    onError: (error) => notify.apiError(error, "Failed to save contact page settings."),
  });

  const validation = useMemo(() => (form ? updateContactPageSettingsSchema.safeParse(form) : null), [form]);
  const issues = useMemo(
    () => (!validation || validation.success ? [] : validation.error.issues.map((issue) => issue.message)),
    [validation]
  );

  if (!hasViewAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-6 py-20 text-center shadow-xs">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldOff className="size-5" aria-hidden="true" />
        </span>
        <p className="text-subtitle text-foreground">Access restricted</p>
        <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">You don&apos;t have permission to view Contact Page Settings.</p>
      </div>
    );
  }

  function patch(partial: Partial<ContactPageSettings>) {
    setForm((current) => (current ? { ...current, ...partial } : current));
  }

  function patchItem(index: number, partial: Partial<ContactItem>) {
    setForm((current) =>
      current ? { ...current, contact_items: current.contact_items.map((item, i) => (i === index ? { ...item, ...partial } : item)) } : current
    );
  }

  const disabled = !hasUpdateAccess || saveMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Contact Page Settings"
        description="Manage the public Contact Us page: its heading, text, contact details, form position and SEO. The form itself is managed in Consultation Form Settings."
        action={
          hasUpdateAccess && (
            <Button onClick={() => form && saveMutation.mutate(form)} disabled={!form || issues.length > 0 || saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {saveMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          )
        }
      />

      {settingsQuery.isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-20 text-body text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading…
        </div>
      )}

      {settingsQuery.isError && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Couldn&apos;t load the contact page settings.
        </div>
      )}

      {form && (
        <>
          {issues.length > 0 && (
            <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <ul className="list-disc pl-5">
                {issues.map((message, i) => (
                  <li key={i}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-xs">
            <h2 className="text-subtitle text-foreground">Intro</h2>
            <div className="flex items-center gap-3">
              <Switch id="show-badge" checked={form.show_badge} onCheckedChange={(v) => patch({ show_badge: v })} disabled={disabled} />
              <FieldLabel htmlFor="show-badge">Show the small badge above the heading</FieldLabel>
            </div>
            <Field>
              <FieldLabel htmlFor="badge-text">Badge text</FieldLabel>
              <Input id="badge-text" value={form.badge_text} maxLength={100} disabled={disabled} onChange={(e) => patch({ badge_text: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="heading">Heading *</FieldLabel>
              <Input id="heading" value={form.heading} maxLength={255} disabled={disabled} onChange={(e) => patch({ heading: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Supporting text *</FieldLabel>
              <Textarea id="description" rows={2} value={form.description} maxLength={500} disabled={disabled} onChange={(e) => patch({ description: e.target.value })} />
            </Field>
          </section>

          <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-subtitle text-foreground">Contact details</h2>
              <div className="flex items-center gap-3">
                <Switch id="show-details" checked={form.show_contact_details} onCheckedChange={(v) => patch({ show_contact_details: v })} disabled={disabled} />
                <FieldLabel htmlFor="show-details">Show this section</FieldLabel>
              </div>
            </div>
            <FieldDescription>
              Rows appear in this order. Email and phone rows become mailto:/tel: links. Nothing is shown until you add real details.
            </FieldDescription>

            {form.contact_items.length === 0 && <p className="text-body-sm text-muted-foreground">No contact rows yet.</p>}

            {form.contact_items.map((item, index) => (
              <div key={index} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[10rem_1fr_1.4fr_auto]">
                <select
                  aria-label="Icon"
                  className={SELECT_CLASS}
                  value={item.icon}
                  disabled={disabled}
                  onChange={(e) => patchItem(index, { icon: e.target.value as ContactIconKey })}
                >
                  {CONTACT_ICON_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {CONTACT_ICON_LABELS[key]}
                    </option>
                  ))}
                </select>
                <Input aria-label="Label" placeholder="Label, e.g. Email:" value={item.label} maxLength={60} disabled={disabled} onChange={(e) => patchItem(index, { label: e.target.value })} />
                <Input aria-label="Value" placeholder="Value" value={item.value} maxLength={500} disabled={disabled} onChange={(e) => patchItem(index, { value: e.target.value })} />
                <div className="flex items-center gap-1">
                  <Switch aria-label="Visible" checked={item.visible} onCheckedChange={(v) => patchItem(index, { visible: v })} disabled={disabled} />
                  <Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={disabled || index === 0} onClick={() => patch({ contact_items: move(form.contact_items, index, -1) })}>
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" aria-label="Move down" disabled={disabled || index === form.contact_items.length - 1} onClick={() => patch({ contact_items: move(form.contact_items, index, 1) })}>
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove row" disabled={disabled} onClick={() => patch({ contact_items: form.contact_items.filter((_, i) => i !== index) })}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}

            {hasUpdateAccess && form.contact_items.length < MAX_CONTACT_ITEMS && (
              <div className="flex flex-wrap gap-2">
                {CONTACT_ICON_KEYS.map((key) => (
                  <Button
                    key={key}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() => patch({ contact_items: [...form.contact_items, { icon: key, label: ITEM_PRESETS[key], value: "", visible: true }] })}
                  >
                    <Plus className="size-4" aria-hidden="true" /> {CONTACT_ICON_LABELS[key]}
                  </Button>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-xs">
            <h2 className="text-subtitle text-foreground">Form placement</h2>
            <Field>
              <FieldLabel htmlFor="form-position">Form position (desktop)</FieldLabel>
              <select id="form-position" className={SELECT_CLASS} value={form.form_position} disabled={disabled} onChange={(e) => patch({ form_position: e.target.value as "left" | "right" })}>
                <option value="right">Right of the text</option>
                <option value="left">Left of the text</option>
              </select>
            </Field>
            <div className="flex items-center gap-3">
              <Switch id="show-form-heading" checked={form.show_form_heading} onCheckedChange={(v) => patch({ show_form_heading: v })} disabled={disabled} />
              <FieldLabel htmlFor="show-form-heading">Show the form&apos;s title and description above the fields</FieldLabel>
            </div>
            <FieldDescription>
              The form&apos;s fields, labels, dropdowns, button text and privacy note are managed in Consultation Form Settings.
            </FieldDescription>
          </section>

          <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-xs">
            <h2 className="text-subtitle text-foreground">SEO</h2>
            <Field>
              <FieldLabel htmlFor="meta-title">Meta title</FieldLabel>
              <Input id="meta-title" value={form.meta_title} maxLength={255} disabled={disabled} onChange={(e) => patch({ meta_title: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="meta-description">Meta description</FieldLabel>
              <Textarea id="meta-description" rows={3} value={form.meta_description} maxLength={1000} disabled={disabled} onChange={(e) => patch({ meta_description: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="meta-keyword">Meta keywords (comma separated)</FieldLabel>
              <Input id="meta-keyword" value={form.meta_keyword} maxLength={500} disabled={disabled} onChange={(e) => patch({ meta_keyword: e.target.value })} />
            </Field>
          </section>
        </>
      )}
    </div>
  );
}
