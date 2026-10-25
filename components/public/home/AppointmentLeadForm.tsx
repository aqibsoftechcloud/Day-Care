"use client";

import { useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { LEAD_HONEYPOT_FIELD } from "@/lib/consultation-form/honeypot";
import { submitAppointmentLead } from "./appointment-lead-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useConsultationForm } from "./ConsultationFormConfigContext";
import { COUNTRY_CODES, type ConsultationFormField } from "@/types/consultation-form-settings";
import {
  COUNTRY_CODE_SUFFIX,
  treatmentOptionsFor,
  validateConsultationSubmission,
} from "@/lib/consultation-form/validate";
import { cn } from "@/lib/utils";

const SELECT_CLASS_NAME =
  "h-10 w-full appearance-none rounded-md pr-9 border border-input bg-transparent px-3 text-sm text-slate-900 shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive";

/** Native arrows sit flush against the border and differ per browser, so selects are `appearance-none` and share this one chevron (non-interactive, vertically centred). */
function SelectChevron() {
  return (
    <ChevronDown
      className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
      aria-hidden="true"
    />
  );
}

type AppointmentLeadFormProps = {
  /**
   * Presentation only — never changes fields, validation or submission.
   * `card` is the dark-headed booking card used across the site; `contact`
   * is the light, bordered form panel used on /contact-us.
   */
  variant?: "card" | "contact";
  /** `contact` variant only: show the configured form title/description above the fields (the card variant always shows them). */
  showHeading?: boolean;
  /** Optional page context. Applied only when it matches a real, active option — otherwise ignored. */
  defaultCityId?: number | null;
  /** A treatment option value (`city:{id}` / `global:{id}`). */
  defaultTreatment?: string | null;
};

/**
 * The one shared booking card, rendered identically everywhere on the
 * public site (Homepage Hero, Treatment/Speciality/Global/Blog Hero,
 * Hospital Hero, and the various Final CTA sections). It has no
 * hardcoded fields: the title, description, button label, privacy note,
 * and the ordered list of fields (labels, placeholders, required flags,
 * dropdown sources, popular-city buttons) all come from
 * `useConsultationForm()` — the admin-saved configuration resolved once in
 * `app/(public)/layout.tsx`. Every control reads and writes the single
 * `values` state below, so the popular-city buttons, the dropdowns and the
 * submitted payload can never disagree. The server (see
 * `services/consultation-lead.service.ts`) re-validates everything; the
 * client-side pass only provides instant feedback.
 */
export function AppointmentLeadForm({
  variant = "card",
  showHeading = false,
  defaultCityId = null,
  defaultTreatment = null,
}: AppointmentLeadFormProps = {}) {
  const contact = variant === "contact";
  const { settings, options, loadError } = useConsultationForm();
  const router = useRouter();
  const [isRetrying, startRetry] = useTransition();
  // Unique per instance — a page can legitimately render this form more
  // than once (e.g. the Speciality page's Hero and its own Final CTA),
  // and hardcoded ids would create duplicate DOM ids/mismatched labels.
  const id = useId();
  const fields = useMemo(() => settings.fields.filter((f) => f.enabled), [settings.fields]);

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    let city = defaultCityId !== null && options.cities.some((c) => c.id === defaultCityId) ? defaultCityId : null;
    // A city-scoped treatment link without a (valid) city implies that treatment's own city.
    const cityTreatment = defaultTreatment?.startsWith("city:")
      ? options.cityTreatments.find((t) => `city:${t.id}` === defaultTreatment)
      : undefined;
    if (city === null && cityTreatment && options.cities.some((c) => c.id === cityTreatment.cityId)) city = cityTreatment.cityId;
    if (city !== null) initial.city = String(city);
    if (defaultTreatment && treatmentOptionsFor(options, city).some((o) => o.value === defaultTreatment)) {
      initial.treatment = defaultTreatment;
    }
    return initial;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // A ref (not state) so a second click in the same tick is rejected before React re-renders the disabled button.
  const inFlight = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const selectedCityId = values.city && /^\d+$/.test(values.city) ? Number(values.city) : null;
  const treatmentOptions = useMemo(() => treatmentOptionsFor(options, selectedCityId), [options, selectedCityId]);

  function setValue(key: string, value: string) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      // Treatments depend on the city: drop a pick that the new city doesn't offer.
      if (key === "city" && next.treatment) {
        const cityId = value && /^\d+$/.test(value) ? Number(value) : null;
        if (!treatmentOptionsFor(options, cityId).some((o) => o.value === next.treatment)) next.treatment = "";
      }
      return next;
    });
    // Editing a field clears its own error (and the treatment's, when the city changes).
    setErrors((current) =>
      Object.fromEntries(Object.entries(current).filter(([k]) => k !== key && !(key === "city" && k === "treatment")))
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;

    setFormMessage("");
    const local = validateConsultationSubmission(settings, values, options);
    if (!local.ok) {
      setErrors(local.errors);
      focusFirstInvalid(local.errors);
      return;
    }

    inFlight.current = true;
    setIsPending(true);
    setErrors({});

    try {
      const result = await submitAppointmentLead(values);

      if (result.success) {
        setSuccessMessage(result.message);
        return;
      }

      // Nothing is cleared: the visitor's input stays exactly as typed.
      setErrors(result.errors ?? {});
      setFormMessage(result.errors && Object.keys(result.errors).length > 0 ? "" : result.message);
      if (result.errors) focusFirstInvalid(result.errors);
    } catch {
      setFormMessage("We couldn't reach the server. Check your connection and try again — your details are still here.");
    } finally {
      inFlight.current = false;
      setIsPending(false);
    }
  }

  function focusFirstInvalid(errorMap: Record<string, string>) {
    const first = fields.find((f) => errorMap[f.key]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[data-field-key="${first.key}"]`)?.focus();
  }

  if (loadError) {
    return (
      <div className="w-full max-w-md overflow-hidden rounded-(--public-radius-card) border border-slate-100 bg-white shadow-xl">
        <div role="alert" className="flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-base font-semibold text-slate-900">We couldn&apos;t load the appointment form.</p>
          <p className="text-sm text-slate-500">This is a temporary problem on our side. Please try again.</p>
          <Button type="button" onClick={() => startRetry(() => router.refresh())} disabled={isRetrying}>
            {isRetrying ? "Retrying…" : "Retry"}
          </Button>
        </div>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="w-full overflow-hidden rounded-(--public-radius-card) border border-slate-100 bg-white shadow-xl">
        <div className="flex flex-col items-center gap-3 p-8 text-center" role="status">
          <CheckCircle2 className="size-10 text-(--color-cta-primary-bg)" aria-hidden="true" />
          <p className="text-lg font-semibold text-slate-900">Request received</p>
          <p className="text-sm text-slate-500">{successMessage}</p>
        </div>
      </div>
    );
  }

  function renderField(field: ConsultationFormField) {
    const fieldId = `${id}-${field.key}`;
    const error = errors[field.key];
    const common = {
      id: fieldId,
      "data-field-key": field.key,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `${fieldId}-error` : undefined,
      disabled: isPending,
    } as const;
    const label = (
      <FieldLabel htmlFor={fieldId}>
        {field.label}
        {field.required && <span className="text-destructive" aria-hidden="true"> *</span>}
      </FieldLabel>
    );
    const errorNode = <FieldError id={`${fieldId}-error`} errors={[error ? { message: error } : undefined]} />;

    if (field.type === "checkbox") {
      return (
        <Field key={field.key} data-invalid={!!error || undefined}>
          <label htmlFor={fieldId} className="flex items-start gap-2 text-sm text-slate-700">
            <input
              {...common}
              type="checkbox"
              checked={values[field.key] === "true"}
              onChange={(e) => setValue(field.key, e.target.checked ? "true" : "")}
              className="mt-0.5 size-4 rounded border-slate-300 accent-(--color-cta-primary-bg)"
            />
            <span>
              {field.label}
              {field.required && <span className="text-destructive" aria-hidden="true"> *</span>}
            </span>
          </label>
          {errorNode}
        </Field>
      );
    }

    if (field.type === "select") {
      const selectOptions =
        field.source === "cities"
          ? options.cities.map((c) => ({ value: String(c.id), label: c.name }))
          : field.source === "treatments"
            ? treatmentOptions
            : field.options;

      return (
        <Field key={field.key} data-invalid={!!error || undefined}>
          {label}
          <div className="relative">
          <select
            {...common}
            value={values[field.key] ?? ""}
            onChange={(e) => setValue(field.key, e.target.value)}
            className={cn(SELECT_CLASS_NAME, contact && "bg-white")}
          >
            <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
            {selectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <SelectChevron />
          </div>
          {field.key === "city" && settings.show_popular_cities && settings.popular_city_ids.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1" role="group" aria-label="Popular cities">
              {settings.popular_city_ids.map((cityId) => {
                const city = options.cities.find((c) => c.id === cityId);
                if (!city) return null;
                const selected = values.city === String(city.id);
                return (
                  <button
                    key={city.id}
                    type="button"
                    aria-pressed={selected}
                    disabled={isPending}
                    onClick={() => setValue("city", String(city.id))}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                      selected
                        ? "border-(--color-cta-primary-bg) bg-(--color-cta-primary-bg) text-(--color-cta-primary-text)"
                        : "border-slate-300 bg-white text-slate-700 hover:border-(--color-cta-primary-bg) hover:text-(--color-cta-primary-bg)"
                    )}
                  >
                    {city.name}
                  </button>
                );
              })}
            </div>
          )}
          {errorNode}
        </Field>
      );
    }

    if (field.type === "textarea") {
      return (
        <Field key={field.key} data-invalid={!!error || undefined}>
          {label}
          <Textarea
            {...common}
            value={values[field.key] ?? ""}
            onChange={(e) => setValue(field.key, e.target.value)}
            placeholder={field.placeholder}
            maxLength={1000}
            rows={contact ? 5 : 3}
            className={cn(contact && "bg-white")}
          />
          {errorNode}
        </Field>
      );
    }

    if (field.type === "phone") {
      const ccKey = field.key + COUNTRY_CODE_SUFFIX;
      return (
        <Field key={field.key} data-invalid={!!error || undefined}>
          {label}
          <div className="flex gap-2">
            <div className={cn("relative shrink-0", contact ? "w-24 sm:w-28" : "w-28")}>
            <select
              aria-label="Country code"
              value={values[ccKey] ?? settings.default_country_code}
              onChange={(e) => setValue(ccKey, e.target.value)}
              disabled={isPending}
              className={cn(SELECT_CLASS_NAME, contact && "bg-white")}
            >
              {COUNTRY_CODES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.label}
                </option>
              ))}
            </select>
            <SelectChevron />
            </div>
            <Input
              {...common}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={values[field.key] ?? ""}
              onChange={(e) => setValue(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={cn("h-10", contact && "bg-white")}
            />
          </div>
          {errorNode}
        </Field>
      );
    }

    return (
      <Field key={field.key} data-invalid={!!error || undefined}>
        {label}
        <Input
          {...common}
          type={field.type === "email" ? "email" : "text"}
          autoComplete={field.key === "full_name" ? "name" : field.type === "email" ? "email" : "off"}
          value={values[field.key] ?? ""}
          onChange={(e) => setValue(field.key, e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.key === "full_name" ? 150 : 255}
          className={cn("h-10", contact && "bg-white")}
        />
        {errorNode}
      </Field>
    );
  }

  return (
    <div
      className={cn(
        "w-full",
        contact
          ? "rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-7"
          : "max-w-md overflow-hidden rounded-(--public-radius-card) border border-slate-100 bg-white shadow-xl"
      )}
    >
      {contact && showHeading && (
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">{settings.form_title}</h2>
          <p className="mt-1 text-sm text-slate-500">{settings.form_description}</p>
        </div>
      )}
      {!contact && <div className="bg-(--color-hero-background) px-6 py-4">
        <h2 className="text-lg font-bold text-(--color-hero-heading)">{settings.form_title}</h2>
        <p className="mt-1 text-sm text-white/70">{settings.form_description}</p>
      </div>}

      <form ref={formRef} onSubmit={handleSubmit} noValidate className={cn("flex flex-col", contact ? "gap-4" : "gap-3 p-5")}>
        {formMessage && (
          <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formMessage}
          </div>
        )}

        {/* Honeypot: invisible to people and assistive tech; bots that fill every input reveal themselves. */}
        <div aria-hidden="true" className="absolute -left-2499 h-0 w-0 overflow-hidden">
          <label>
            Leave this field empty
            <input
              type="text"
              name={LEAD_HONEYPOT_FIELD}
              tabIndex={-1}
              autoComplete="off"
              value={values[LEAD_HONEYPOT_FIELD] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [LEAD_HONEYPOT_FIELD]: e.target.value }))}
            />
          </label>
        </div>

        {fields.map(renderField)}

        <Button
          type="submit"
          disabled={isPending}
          className={cn(
            "h-10 bg-(--color-cta-primary-bg) text-sm font-semibold text-(--color-cta-primary-text) hover:bg-(--color-cta-primary-bg)/90",
            contact ? "self-start px-6" : "w-full"
          )}
        >
          {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {isPending ? "Submitting…" : settings.submit_label}
        </Button>

        {settings.privacy_message && <p className={cn("text-xs text-slate-400", !contact && "text-center")}>{settings.privacy_message}</p>}
      </form>
    </div>
  );
}
