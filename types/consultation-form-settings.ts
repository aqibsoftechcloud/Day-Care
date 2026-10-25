export type ConsultationFieldType = "text" | "email" | "phone" | "select" | "textarea" | "checkbox";

/** Where a select field's options come from. Only these fixed, server-resolved sources exist — CMS config can never express a query or expression. */
export type ConsultationOptionsSource = "none" | "treatments" | "cities" | "manual";

export type ConsultationManualOption = { value: string; label: string };

/**
 * Keys with built-in meaning. They map onto real `appointment_leads`
 * columns (see services/consultation-lead.service.ts); every other key is
 * a custom field whose answer is stored in `appointment_leads.extra_data`.
 * A core key's type/source is fixed (an admin can relabel, reorder, require
 * or disable it, but cannot turn `city` into a textarea).
 */
export const CORE_FIELD_KEYS = ["full_name", "phone", "email", "treatment", "city"] as const;
export type CoreFieldKey = (typeof CORE_FIELD_KEYS)[number];

export const CORE_FIELD_TYPES: Record<CoreFieldKey, { type: ConsultationFieldType; source: ConsultationOptionsSource }> = {
  full_name: { type: "text", source: "none" },
  phone: { type: "phone", source: "none" },
  email: { type: "email", source: "none" },
  treatment: { type: "select", source: "treatments" },
  city: { type: "select", source: "cities" },
};

export type ConsultationFormField = {
  /** Stable, unique, never derived from the label. Lowercase snake_case. */
  key: string;
  label: string;
  placeholder: string;
  type: ConsultationFieldType;
  required: boolean;
  enabled: boolean;
  /** Only meaningful for `select`; `none` for every other type. */
  source: ConsultationOptionsSource;
  /** Only for `source: "manual"`. */
  options: ConsultationManualOption[];
};

export type ConsultationFormSettings = {
  form_title: string;
  form_description: string;
  submit_label: string;
  privacy_message: string;
  /** Array order IS the display order. */
  fields: ConsultationFormField[];
  show_popular_cities: boolean;
  /** Ordered active-city ids shown as quick-select buttons under the city dropdown. */
  popular_city_ids: number[];
  /** Digits only, e.g. "91". Used when a visitor doesn't pick a country code. */
  default_country_code: string;
};

export const MAX_CONSULTATION_FIELDS = 20;
export const MAX_POPULAR_CITIES = 12;
export const FIELD_KEY_PATTERN = /^[a-z][a-z0-9_]{1,39}$/;

/** Country codes offered next to the phone input. National-number length rules live in lib/consultation-form/phone.ts. */
export const COUNTRY_CODES = [
  { code: "91", label: "IN +91" },
  { code: "1", label: "US/CA +1" },
  { code: "44", label: "UK +44" },
  { code: "971", label: "AE +971" },
  { code: "966", label: "SA +966" },
  { code: "974", label: "QA +974" },
  { code: "968", label: "OM +968" },
  { code: "965", label: "KW +965" },
  { code: "880", label: "BD +880" },
  { code: "977", label: "NP +977" },
  { code: "94", label: "LK +94" },
  { code: "61", label: "AU +61" },
] as const;

export const DEFAULT_CONSULTATION_FORM_FIELDS: ConsultationFormField[] = [
  { key: "full_name", label: "Full Name", placeholder: "Enter your full name", type: "text", required: true, enabled: true, source: "none", options: [] },
  { key: "phone", label: "Phone Number", placeholder: "Enter your phone number", type: "phone", required: true, enabled: true, source: "none", options: [] },
  { key: "treatment", label: "Treatment", placeholder: "Select treatment", type: "select", required: true, enabled: true, source: "treatments", options: [] },
  { key: "city", label: "City", placeholder: "Select city", type: "select", required: true, enabled: true, source: "cities", options: [] },
  // Available out of the box but off by default: the reference form doesn't ask for it.
  { key: "email", label: "Email", placeholder: "you@example.com", type: "email", required: false, enabled: false, source: "none", options: [] },
];

/**
 * The exact strings AppointmentLeadForm hardcoded before this feature —
 * both the DB row's factory default and the fallback used if the DB is
 * ever unavailable, so the public form always renders something
 * identical to its original, pre-admin-managed appearance.
 */
export const DEFAULT_CONSULTATION_FORM_SETTINGS: ConsultationFormSettings = {
  form_title: "Book FREE Consultation",
  form_description: "Share your details and our team will call you back.",
  submit_label: "Request a Call Back",
  privacy_message: "By submitting, you agree to be contacted regarding your appointment.",
  fields: DEFAULT_CONSULTATION_FORM_FIELDS,
  show_popular_cities: false,
  popular_city_ids: [],
  default_country_code: "91",
};

/** Trusted option data the server resolves for city/treatment selects. */
export type ConsultationFormOptions = {
  cities: { id: number; name: string }[];
  /** City-independent global treatments (used when no city is selected). Option value: `global:{id}`. */
  globalTreatments: { id: number; name: string }[];
  /** City-scoped treatments (used once a city is selected). Option value: `city:{id}`. */
  cityTreatments: { id: number; cityId: number; name: string }[];
};

export const EMPTY_CONSULTATION_FORM_OPTIONS: ConsultationFormOptions = { cities: [], globalTreatments: [], cityTreatments: [] };

/** Everything the public form needs: admin config + trusted option lists. */
export type PublicConsultationForm = {
  settings: ConsultationFormSettings;
  options: ConsultationFormOptions;
  /** True when the saved configuration or the city/treatment lists could not be loaded. `settings`/`options` are then placeholders and the form must show an error, not render them. */
  loadError?: boolean;
};
