import { z } from "zod";
import {
  CORE_FIELD_KEYS,
  CORE_FIELD_TYPES,
  FIELD_KEY_PATTERN,
  MAX_CONSULTATION_FIELDS,
  MAX_POPULAR_CITIES,
  type CoreFieldKey,
} from "@/types/consultation-form-settings";

const manualOptionSchema = z.object({
  value: z.string().trim().min(1).max(100),
  label: z.string().trim().min(1, "Option label is required").max(150),
});

const fieldSchema = z.object({
  key: z.string().trim().regex(FIELD_KEY_PATTERN, "Key must be lowercase letters, numbers and underscores, starting with a letter"),
  label: z.string().trim().min(1, "Field label is required").max(120),
  placeholder: z.string().trim().max(150).default(""),
  type: z.enum(["text", "email", "phone", "select", "textarea", "checkbox"]),
  required: z.boolean(),
  enabled: z.boolean(),
  source: z.enum(["none", "treatments", "cities", "manual"]),
  options: z.array(manualOptionSchema).max(50).default([]),
});

const isCoreKey = (key: string): key is CoreFieldKey => (CORE_FIELD_KEYS as readonly string[]).includes(key);

/** The whole editable form definition. Validated on every write AND on every read of stored JSON. */
export const consultationFormConfigSchema = z
  .object({
    fields: z.array(fieldSchema).min(1, "Add at least one field").max(MAX_CONSULTATION_FIELDS, `At most ${MAX_CONSULTATION_FIELDS} fields`),
    show_popular_cities: z.boolean(),
    popular_city_ids: z.array(z.number().int().positive()).max(MAX_POPULAR_CITIES),
    default_country_code: z.string().trim().regex(/^\d{1,4}$/, "Country code must be digits only"),
  })
  .superRefine((config, ctx) => {
    const seen = new Set<string>();

    config.fields.forEach((field, index) => {
      const at = (message: string, path: (string | number)[] = []) =>
        ctx.addIssue({ code: "custom", message, path: ["fields", index, ...path] });

      if (seen.has(field.key)) at(`Duplicate field key "${field.key}"`, ["key"]);
      seen.add(field.key);

      if (isCoreKey(field.key)) {
        const fixed = CORE_FIELD_TYPES[field.key];
        if (field.type !== fixed.type || field.source !== fixed.source) {
          at(`"${field.key}" has a fixed type and cannot be changed`, ["type"]);
        }
      } else {
        if (field.source === "treatments" || field.source === "cities") {
          at("Treatments and cities can only be used by the built-in Treatment and City fields", ["source"]);
        }
      }

      if (field.type === "select") {
        if (field.source === "none") at("A dropdown needs an option source", ["source"]);
        if (field.source === "manual") {
          if (field.options.length === 0) at("Add at least one option", ["options"]);
          const values = new Set<string>();
          for (const option of field.options) {
            if (values.has(option.value)) at(`Duplicate option value "${option.value}"`, ["options"]);
            values.add(option.value);
          }
        }
      } else if (field.source !== "none") {
        at("Only dropdown fields can have an option source", ["source"]);
      }
    });

    // A lead must always be reachable: the name and phone fields are mandatory and always on.
    for (const key of ["full_name", "phone"] as const) {
      const field = config.fields.find((f) => f.key === key);
      if (!field) {
        ctx.addIssue({ code: "custom", message: `The "${key === "full_name" ? "Full Name" : "Phone Number"}" field is required for every lead and cannot be removed`, path: ["fields"] });
      } else if (!field.enabled || !field.required) {
        ctx.addIssue({ code: "custom", message: `"${field.label}" must stay enabled and required`, path: ["fields"] });
      }
    }

    if (new Set(config.popular_city_ids).size !== config.popular_city_ids.length) {
      ctx.addIssue({ code: "custom", message: "Duplicate popular city", path: ["popular_city_ids"] });
    }
  });

export const updateConsultationFormSettingsSchema = z
  .object({
    form_title: z.string().trim().min(1, "Form title is required").max(255, "Form title is too long"),
    form_description: z.string().trim().min(1, "Form description is required").max(500, "Form description is too long"),
    submit_label: z.string().trim().min(1, "Submit button label is required").max(100),
    privacy_message: z.string().trim().max(500).default(""),
  })
  .and(consultationFormConfigSchema);

export type UpdateConsultationFormSettingsInput = z.infer<typeof updateConsultationFormSettingsSchema>;
