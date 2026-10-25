import { normalizePhone } from "./phone";
import type {
  ConsultationFormField,
  ConsultationFormOptions,
  ConsultationFormSettings,
} from "@/types/consultation-form-settings";

/** Suffix of the companion key that carries a phone field's chosen country code, e.g. `phone__cc`. */
export const COUNTRY_CODE_SUFFIX = "__cc";

export type RawConsultationValues = Record<string, unknown>;

export type CleanConsultationSubmission = {
  fullName: string;
  phone: string;
  email: string;
  cityId: number | null;
  cityName: string | null;
  treatment: { kind: "city" | "global"; id: number; name: string } | null;
  /** Answers to every non-column field (custom ones), with the label as it was at submit time. */
  extra: { key: string; label: string; value: string }[];
};

export type ConsultationValidationResult =
  | { ok: true; clean: CleanConsultationSubmission }
  | { ok: false; errors: Record<string, string> };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

/** `city:12` / `global:4` -> parsed; anything else (including tampered values) -> null. */
export function parseTreatmentValue(value: string): { kind: "city" | "global"; id: number } | null {
  const match = /^(city|global):(\d{1,10})$/.exec(value);
  return match ? { kind: match[1] as "city" | "global", id: Number(match[2]) } : null;
}

/** The treatment options a visitor may pick for a given city (or none selected). Same rule on client and server. */
export function treatmentOptionsFor(options: ConsultationFormOptions, cityId: number | null) {
  if (cityId === null) {
    return options.globalTreatments.map((t) => ({ value: `global:${t.id}`, label: t.name }));
  }
  return options.cityTreatments.filter((t) => t.cityId === cityId).map((t) => ({ value: `city:${t.id}`, label: t.name }));
}

/**
 * The single validation routine for the consultation form. Only ENABLED
 * fields are read — a disabled, removed or unknown key in `raw` is ignored
 * entirely (never an error, never persisted), so a tampered request can't
 * smuggle data in. `options` must be the trusted, server-resolved lists
 * when this runs on the server; the browser calls it with the same lists
 * purely for instant inline feedback.
 */
export function validateConsultationSubmission(
  settings: ConsultationFormSettings,
  raw: RawConsultationValues,
  options: ConsultationFormOptions
): ConsultationValidationResult {
  const errors: Record<string, string> = {};
  const clean: CleanConsultationSubmission = {
    fullName: "",
    phone: "",
    email: "",
    cityId: null,
    cityName: null,
    treatment: null,
    extra: [],
  };

  const fields = settings.fields.filter((f) => f.enabled);
  const requiredMessage = (field: ConsultationFormField) =>
    field.type === "select" ? `Select ${field.label.toLowerCase()}.` : `${field.label} is required.`;

  // City first: the treatment's validity depends on it.
  const cityField = fields.find((f) => f.key === "city");
  if (cityField) {
    const value = asString(raw.city);
    if (!value) {
      if (cityField.required) errors.city = requiredMessage(cityField);
    } else {
      const city = /^\d{1,10}$/.test(value) ? options.cities.find((c) => c.id === Number(value)) : undefined;
      if (!city) errors.city = "Select a valid city.";
      else {
        clean.cityId = city.id;
        clean.cityName = city.name;
      }
    }
  }

  for (const field of fields) {
    if (field.key === "city") continue;
    const value = asString(raw[field.key]);

    if (field.type === "checkbox") {
      const checked = raw[field.key] === true || value === "true" || value === "on";
      if (field.required && !checked) errors[field.key] = `Please accept: ${field.label}`;
      else if (checked) clean.extra.push({ key: field.key, label: field.label, value: "Yes" });
      continue;
    }

    if (!value) {
      if (field.required) errors[field.key] = requiredMessage(field);
      continue;
    }

    switch (field.key) {
      case "full_name": {
        if (value.length < 2 || value.length > 150 || !NAME_PATTERN.test(value)) errors.full_name = "Enter your full name.";
        else clean.fullName = value.replace(/\s+/g, " ");
        continue;
      }
      case "phone": {
        const cc = asString(raw[field.key + COUNTRY_CODE_SUFFIX]) || settings.default_country_code;
        const result = normalizePhone(value, cc);
        if (result.ok) clean.phone = result.value;
        else errors.phone = result.message;
        continue;
      }
      case "email": {
        if (value.length > 255 || !EMAIL_PATTERN.test(value)) errors.email = "Enter a valid email address.";
        else clean.email = value.toLowerCase();
        continue;
      }
      case "treatment": {
        const parsed = parseTreatmentValue(value);
        const allowed = parsed && treatmentOptionsFor(options, clean.cityId).find((o) => o.value === value);
        if (!parsed || !allowed) {
          errors.treatment = errors.city ? "Select a valid treatment." : "Select a treatment available for the chosen city.";
        } else {
          clean.treatment = { kind: parsed.kind, id: parsed.id, name: allowed.label };
        }
        continue;
      }
    }

    // Custom fields -> extra_data.
    if (field.type === "select") {
      const option = field.source === "manual" ? field.options.find((o) => o.value === value) : undefined;
      if (!option) errors[field.key] = "Select a valid option.";
      else clean.extra.push({ key: field.key, label: field.label, value: option.label });
    } else if (field.type === "email") {
      if (!EMAIL_PATTERN.test(value) || value.length > 255) errors[field.key] = "Enter a valid email address.";
      else clean.extra.push({ key: field.key, label: field.label, value: value.toLowerCase() });
    } else if (field.type === "phone") {
      const result = normalizePhone(value, asString(raw[field.key + COUNTRY_CODE_SUFFIX]) || settings.default_country_code);
      if (!result.ok) errors[field.key] = result.message;
      else clean.extra.push({ key: field.key, label: field.label, value: result.value });
    } else {
      const max = field.type === "textarea" ? 1000 : 255;
      if (value.length > max) errors[field.key] = `${field.label} must be at most ${max} characters.`;
      else clean.extra.push({ key: field.key, label: field.label, value });
    }
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, clean };
}
