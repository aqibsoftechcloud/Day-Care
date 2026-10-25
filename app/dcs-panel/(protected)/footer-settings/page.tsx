"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Loader2, Plus, ShieldOff, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TreatmentImageField } from "@/components/admin/TreatmentImageField";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePermission } from "@/hooks/usePermission";
import { getFooterSettings, updateFooterSettings } from "@/lib/api/footer-settings";
import { notify } from "@/lib/toast";
import { CONTACT_ICON_KEYS, CONTACT_ICON_LABELS, MAX_CONTACT_ITEMS, type ContactIconKey, type ContactItem } from "@/types/contact-page-settings";
import {
  FOOTER_INCLUDE_LABELS,
  FOOTER_INCLUDE_SOURCES,
  MAX_FOOTER_COLUMNS,
  MAX_FOOTER_LINKS_PER_COLUMN,
  SOCIAL_PLATFORMS,
  SOCIAL_PLATFORM_LABELS,
  type FooterColumnConfig,
  type FooterIncludeSource,
  type FooterLinkItem,
  type FooterSettings,
  type FooterSocialLink,
  type SocialPlatform,
} from "@/types/footer-settings";
import { updateFooterSettingsSchema } from "@/validators/footer-settings.validator";

const footerSettingsKeys = { all: ["footer-settings"] as const };

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const CARD = "flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-xs";

function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Row controls shared by every orderable list on this page. */
function RowTools({ index, count, disabled, onMove, onRemove }: { index: number; count: number; disabled: boolean; onMove: (delta: number) => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={disabled || index === 0} onClick={() => onMove(-1)}>
        <ArrowUp className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" aria-label="Move down" disabled={disabled || index === count - 1} onClick={() => onMove(1)}>
        <ArrowDown className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" aria-label="Remove" disabled={disabled} onClick={onRemove}>
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

/** Editable ordered list of `label` + `href` rows (a column's manual links, or the bottom-bar links). */
function LinkRows({ links, onChange, disabled, max }: { links: FooterLinkItem[]; onChange: (links: FooterLinkItem[]) => void; disabled: boolean; max: number }) {
  return (
    <div className="flex flex-col gap-2">
      {links.map((link, index) => (
        <div key={index} className="grid gap-2 md:grid-cols-[1fr_1.4fr_auto]">
          <Input
            aria-label="Link label"
            placeholder="Label"
            value={link.label}
            maxLength={100}
            disabled={disabled}
            onChange={(e) => onChange(links.map((l, i) => (i === index ? { ...l, label: e.target.value } : l)))}
          />
          <Input
            aria-label="Link URL"
            placeholder="/path, #anchor, https://…, {home}#section, {contact}"
            value={link.href}
            maxLength={500}
            disabled={disabled}
            onChange={(e) => onChange(links.map((l, i) => (i === index ? { ...l, href: e.target.value } : l)))}
          />
          <RowTools index={index} count={links.length} disabled={disabled} onMove={(d) => onChange(move(links, index, d))} onRemove={() => onChange(links.filter((_, i) => i !== index))} />
        </div>
      ))}
      {links.length < max && (
        <div>
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onChange([...links, { label: "", href: "" }])}>
            <Plus className="size-4" aria-hidden="true" /> Add link
          </Button>
        </div>
      )}
    </div>
  );
}

export default function FooterSettingsPage() {
  const { canView, canUpdate } = usePermission();
  const hasViewAccess = canView("footer-settings");
  const hasUpdateAccess = canUpdate("footer-settings");
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FooterSettings | null>(null);
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [logoRemoved, setLogoRemoved] = useState(false);

  const settingsQuery = useQuery({
    queryKey: footerSettingsKeys.all,
    queryFn: () => getFooterSettings(),
    enabled: hasViewAccess,
  });

  // Render-time state adjustment instead of an effect — same shape as the other settings pages.
  const [loadedSettings, setLoadedSettings] = useState<FooterSettings | null>(null);
  if (settingsQuery.data && loadedSettings !== settingsQuery.data.settings) {
    setLoadedSettings(settingsQuery.data.settings);
    setForm(settingsQuery.data.settings);
    setLogoFiles([]);
    setLogoRemoved(false);
  }

  const saveMutation = useMutation({
    mutationFn: ({ data, logo }: { data: FooterSettings; logo: File | null | undefined }) => {
      const { logo: _logo, ...rest } = data;
      void _logo;
      return updateFooterSettings(rest, logo);
    },
    onSuccess: (response) => {
      notify.success("Footer saved. Changes are now live on the public site.");
      queryClient.setQueryData(footerSettingsKeys.all, response);
    },
    onError: (error) => notify.apiError(error, "Failed to save footer settings."),
  });

  const issues = useMemo(() => {
    if (!form) return [];
    const { logo: _logo, ...rest } = form;
    void _logo;
    const result = updateFooterSettingsSchema.safeParse(rest);
    return result.success ? [] : result.error.issues.map((issue) => `${issue.path.join(" › ")}: ${issue.message}`);
  }, [form]);

  if (!hasViewAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-6 py-20 text-center shadow-xs">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldOff className="size-5" aria-hidden="true" />
        </span>
        <p className="text-subtitle text-foreground">Access restricted</p>
        <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">You don&apos;t have permission to view Footer Settings.</p>
      </div>
    );
  }

  const disabled = !hasUpdateAccess || saveMutation.isPending;

  function patch(partial: Partial<FooterSettings>) {
    setForm((current) => (current ? { ...current, ...partial } : current));
  }
  function patchColumn(index: number, partial: Partial<FooterColumnConfig>) {
    setForm((current) => (current ? { ...current, columns: current.columns.map((c, i) => (i === index ? { ...c, ...partial } : c)) } : current));
  }
  function patchContact(index: number, partial: Partial<ContactItem>) {
    setForm((current) => (current ? { ...current, contact_items: current.contact_items.map((c, i) => (i === index ? { ...c, ...partial } : c)) } : current));
  }
  function patchSocial(index: number, partial: Partial<FooterSocialLink>) {
    setForm((current) => (current ? { ...current, social_links: current.social_links.map((c, i) => (i === index ? { ...c, ...partial } : c)) } : current));
  }

  function save() {
    if (!form) return;
    const logo = logoFiles.length > 0 ? logoFiles[0] : logoRemoved ? null : undefined;
    saveMutation.mutate({ data: form, logo });
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Footer Settings"
        description="Manage the public website footer: brand and logo, the appointment banner, link columns, contact details, social links and the copyright line."
        action={
          hasUpdateAccess && (
            <Button onClick={save} disabled={!form || issues.length > 0 || saveMutation.isPending}>
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
          Couldn&apos;t load the footer settings.
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

          <section className={CARD}>
            <h2 className="text-subtitle text-foreground">Brand</h2>
            <TreatmentImageField
              label="Logo"
              description="Shown instead of the text wordmark. Use a transparent PNG/WEBP that reads on the dark footer background. If empty, the text below is used."
              currentUrl={form.logo}
              files={logoFiles}
              onFilesChange={(files) => {
                setLogoFiles(files);
                if (files.length > 0) setLogoRemoved(false);
              }}
              removed={logoRemoved}
              onRemove={() => setLogoRemoved(true)}
              disabled={disabled}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="brand-primary">Brand text *</FieldLabel>
                <Input id="brand-primary" value={form.brand_primary} maxLength={100} disabled={disabled} onChange={(e) => patch({ brand_primary: e.target.value })} />
              </Field>
              <Field>
                <FieldLabel htmlFor="brand-accent">Brand text, accent colour part</FieldLabel>
                <Input id="brand-accent" value={form.brand_accent} maxLength={100} disabled={disabled} onChange={(e) => patch({ brand_accent: e.target.value })} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="footer-description">Company description</FieldLabel>
              <Textarea id="footer-description" rows={3} value={form.description} maxLength={1000} disabled={disabled} onChange={(e) => patch({ description: e.target.value })} />
            </Field>
          </section>

          <section className={CARD}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-subtitle text-foreground">Appointment banner</h2>
              <div className="flex items-center gap-3">
                <Switch id="cta-enabled" checked={form.cta_enabled} onCheckedChange={(v) => patch({ cta_enabled: v })} disabled={disabled} />
                <FieldLabel htmlFor="cta-enabled">Show the banner</FieldLabel>
              </div>
            </div>
            <Field>
              <FieldLabel htmlFor="cta-heading">Heading *</FieldLabel>
              <Input id="cta-heading" value={form.cta_heading} maxLength={255} disabled={disabled} onChange={(e) => patch({ cta_heading: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="cta-description">Description</FieldLabel>
              <Textarea id="cta-description" rows={2} value={form.cta_description} maxLength={500} disabled={disabled} onChange={(e) => patch({ cta_description: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="cta-label">Button label *</FieldLabel>
                <Input id="cta-label" value={form.cta_button_label} maxLength={100} disabled={disabled} onChange={(e) => patch({ cta_button_label: e.target.value })} />
              </Field>
              <Field>
                <FieldLabel htmlFor="cta-url">Button link</FieldLabel>
                <Input id="cta-url" value={form.cta_button_url} maxLength={500} placeholder="Empty = Contact Us (with the visitor's city)" disabled={disabled} onChange={(e) => patch({ cta_button_url: e.target.value })} />
              </Field>
            </div>
            <FieldDescription>The banner is also hidden automatically on the Contact Us and hospital detail pages, which have their own booking UI.</FieldDescription>
          </section>

          <section className={CARD}>
            <h2 className="text-subtitle text-foreground">Link columns</h2>
            <FieldDescription>
              Columns appear in this order. A column with no links is not shown. In a link URL, <code>{"{home}"}</code> becomes the home page of the city
              being viewed (or <code>/</code> on global pages) and <code>{"{contact}"}</code> becomes Contact Us for that city, e.g.{" "}
              <code>{"{home}#hospitals-heading"}</code>.
            </FieldDescription>

            {form.columns.map((column, index) => (
              <div key={index} className="flex flex-col gap-3 rounded-lg border border-border p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <Input aria-label="Column heading" placeholder="Column heading" value={column.title} maxLength={100} disabled={disabled} onChange={(e) => patchColumn(index, { title: e.target.value })} />
                  <div className="flex items-center gap-2">
                    <Switch aria-label="Column visible" checked={column.enabled} onCheckedChange={(v) => patchColumn(index, { enabled: v })} disabled={disabled} />
                    <span className="text-body-sm text-muted-foreground">Visible</span>
                  </div>
                  <RowTools index={index} count={form.columns.length} disabled={disabled} onMove={(d) => patch({ columns: move(form.columns, index, d) })} onRemove={() => patch({ columns: form.columns.filter((_, i) => i !== index) })} />
                </div>

                <div>
                  <p className="mb-2 text-body-sm font-medium text-foreground">Manual links</p>
                  <LinkRows links={column.links} max={MAX_FOOTER_LINKS_PER_COLUMN} disabled={disabled} onChange={(links) => patchColumn(index, { links })} />
                </div>

                <div>
                  <p className="mb-2 text-body-sm font-medium text-foreground">Also add automatically</p>
                  <div className="flex flex-col gap-1.5">
                    {FOOTER_INCLUDE_SOURCES.map((source: FooterIncludeSource) => (
                      <label key={source} className="flex items-center gap-2 text-body-sm text-foreground">
                        <input
                          type="checkbox"
                          className="size-4"
                          disabled={disabled}
                          checked={column.include.includes(source)}
                          onChange={(e) => patchColumn(index, { include: e.target.checked ? [...column.include, source] : column.include.filter((s) => s !== source) })}
                        />
                        {FOOTER_INCLUDE_LABELS[source]}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {form.columns.length < MAX_FOOTER_COLUMNS && (
              <div>
                <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => patch({ columns: [...form.columns, { title: "New column", enabled: true, links: [], include: [] }] })}>
                  <Plus className="size-4" aria-hidden="true" /> Add column
                </Button>
              </div>
            )}
          </section>

          <section className={CARD}>
            <h2 className="text-subtitle text-foreground">Contact details</h2>
            <FieldDescription>Shown under the company description. Email and phone rows become mailto:/tel: links. Nothing is shown until you add real details.</FieldDescription>
            {form.contact_items.map((item, index) => (
              <div key={index} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[10rem_1fr_1.4fr_auto]">
                <select aria-label="Icon" className={SELECT_CLASS} value={item.icon} disabled={disabled} onChange={(e) => patchContact(index, { icon: e.target.value as ContactIconKey })}>
                  {CONTACT_ICON_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {CONTACT_ICON_LABELS[key]}
                    </option>
                  ))}
                </select>
                <Input aria-label="Label" placeholder="Label, e.g. Email:" value={item.label} maxLength={60} disabled={disabled} onChange={(e) => patchContact(index, { label: e.target.value })} />
                <Input aria-label="Value" placeholder="Value" value={item.value} maxLength={500} disabled={disabled} onChange={(e) => patchContact(index, { value: e.target.value })} />
                <div className="flex items-center gap-1">
                  <Switch aria-label="Visible" checked={item.visible} onCheckedChange={(v) => patchContact(index, { visible: v })} disabled={disabled} />
                  <RowTools index={index} count={form.contact_items.length} disabled={disabled} onMove={(d) => patch({ contact_items: move(form.contact_items, index, d) })} onRemove={() => patch({ contact_items: form.contact_items.filter((_, i) => i !== index) })} />
                </div>
              </div>
            ))}
            {form.contact_items.length < MAX_CONTACT_ITEMS && (
              <div className="flex flex-wrap gap-2">
                {CONTACT_ICON_KEYS.map((key) => (
                  <Button key={key} type="button" variant="outline" size="sm" disabled={disabled} onClick={() => patch({ contact_items: [...form.contact_items, { icon: key, label: `${CONTACT_ICON_LABELS[key]}:`, value: "", visible: true }] })}>
                    <Plus className="size-4" aria-hidden="true" /> {CONTACT_ICON_LABELS[key]}
                  </Button>
                ))}
              </div>
            )}
          </section>

          <section className={CARD}>
            <h2 className="text-subtitle text-foreground">Social links</h2>
            <FieldDescription>Full https:// profile URLs. They open in a new tab.</FieldDescription>
            {form.social_links.map((link, index) => (
              <div key={index} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[12rem_1fr_auto]">
                <select aria-label="Platform" className={SELECT_CLASS} value={link.platform} disabled={disabled} onChange={(e) => patchSocial(index, { platform: e.target.value as SocialPlatform })}>
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <option key={platform} value={platform}>
                      {SOCIAL_PLATFORM_LABELS[platform]}
                    </option>
                  ))}
                </select>
                <Input aria-label="Profile URL" placeholder="https://…" value={link.url} maxLength={500} disabled={disabled} onChange={(e) => patchSocial(index, { url: e.target.value })} />
                <div className="flex items-center gap-1">
                  <Switch aria-label="Visible" checked={link.visible} onCheckedChange={(v) => patchSocial(index, { visible: v })} disabled={disabled} />
                  <RowTools index={index} count={form.social_links.length} disabled={disabled} onMove={(d) => patch({ social_links: move(form.social_links, index, d) })} onRemove={() => patch({ social_links: form.social_links.filter((_, i) => i !== index) })} />
                </div>
              </div>
            ))}
            <div>
              <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => patch({ social_links: [...form.social_links, { platform: "facebook", url: "", visible: true }] })}>
                <Plus className="size-4" aria-hidden="true" /> Add social link
              </Button>
            </div>
          </section>

          <section className={CARD}>
            <h2 className="text-subtitle text-foreground">Bottom bar</h2>
            <Field>
              <FieldLabel htmlFor="copyright">Copyright text *</FieldLabel>
              <Input id="copyright" value={form.copyright_text} maxLength={500} disabled={disabled} onChange={(e) => patch({ copyright_text: e.target.value })} />
              <FieldDescription>
                <code>{"{year}"}</code> is replaced with the current year.
              </FieldDescription>
            </Field>
            <div>
              <p className="mb-2 text-body-sm font-medium text-foreground">Extra bottom links</p>
              <LinkRows links={form.bottom_links} max={10} disabled={disabled} onChange={(bottom_links) => patch({ bottom_links })} />
            </div>
            <FieldDescription>
              Legal links (Privacy Policy, Terms…) come from Content Management → Pages: set a page&apos;s <strong>Footer placement</strong> to &ldquo;Legal links&rdquo;.
              Footer colours are managed in <Link href="/dcs-panel/website-appearance" className="underline">Website Appearance</Link>.
            </FieldDescription>
          </section>
        </>
      )}
    </div>
  );
}
