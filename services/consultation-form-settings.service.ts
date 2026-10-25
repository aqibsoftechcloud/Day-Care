import { prisma } from "@/lib/prisma";
import {
  DEFAULT_CONSULTATION_FORM_SETTINGS,
  type ConsultationFormSettings,
} from "@/types/consultation-form-settings";
import {
  consultationFormConfigSchema,
  type UpdateConsultationFormSettingsInput,
} from "@/validators/consultation-form-settings.validator";

/** Single-row convention (always id=1) — same pattern as website_theme_settings; there is no legitimate second row. */
const SETTINGS_ROW_ID = 1;

const settingsSelect = {
  form_title: true,
  form_description: true,
  submit_label: true,
  privacy_message: true,
  fields_config: true,
} as const;

type SettingsRow = {
  form_title: string;
  form_description: string;
  submit_label: string | null;
  privacy_message: string | null;
  fields_config: unknown;
};

/**
 * Merges a stored row with the built-in defaults. The stored title and
 * description are always kept as-is (so existing installations keep what
 * their admin typed), and `fields_config` is re-validated on every read —
 * a NULL, hand-edited or otherwise invalid value falls back to the default
 * field set instead of ever breaking the public form.
 */
function toSettings(row: SettingsRow | null, strict = false): ConsultationFormSettings {
  const defaults = DEFAULT_CONSULTATION_FORM_SETTINGS;

  if (!row) {
    return { ...defaults, fields: defaults.fields.map((f) => ({ ...f })) };
  }

  const parsedConfig = row.fields_config == null ? null : consultationFormConfigSchema.safeParse(row.fields_config);

  if (parsedConfig && !parsedConfig.success && strict) {
    // The public form and lead submission must never quietly swap the admin's saved form for the built-in default.
    throw new Error("Stored consultation form field config is invalid: " + JSON.stringify(parsedConfig.error.issues));
  }

  if (parsedConfig && !parsedConfig.success) {
    console.error("Stored consultation form field config is invalid, using defaults:", parsedConfig.error.issues);
  }

  const config = parsedConfig?.success
    ? parsedConfig.data
    : {
        fields: defaults.fields.map((f) => ({ ...f })),
        show_popular_cities: defaults.show_popular_cities,
        popular_city_ids: defaults.popular_city_ids,
        default_country_code: defaults.default_country_code,
      };

  return {
    form_title: row.form_title,
    form_description: row.form_description,
    submit_label: row.submit_label?.trim() || defaults.submit_label,
    privacy_message: row.privacy_message ?? defaults.privacy_message,
    ...config,
  };
}

/**
 * `strict: true` (public form + lead submission): an invalid stored
 * config throws instead of falling back to defaults. A missing row or a
 * NULL `fields_config` is still the legitimate "never customised" state.
 * The admin editor reads leniently so it can open and repair a bad config.
 */
export async function getConsultationFormSettings(options: { strict?: boolean } = {}): Promise<ConsultationFormSettings> {
  const row = await prisma.consultation_form_settings.findUnique({
    where: { id: SETTINGS_ROW_ID },
    select: settingsSelect,
  });

  return toSettings(row, options.strict);
}

export async function updateConsultationFormSettings(
  data: UpdateConsultationFormSettingsInput
): Promise<ConsultationFormSettings> {
  const { form_title, form_description, submit_label, privacy_message, ...config } = data;
  const values = { form_title, form_description, submit_label, privacy_message, fields_config: config };

  const row = await prisma.consultation_form_settings.upsert({
    where: { id: SETTINGS_ROW_ID },
    create: { id: SETTINGS_ROW_ID, ...values },
    update: { ...values, updated_at: new Date() },
    select: settingsSelect,
  });

  return toSettings(row);
}
