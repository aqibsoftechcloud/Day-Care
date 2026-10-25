/** Mirrors prisma/schema.prisma's js_configurations_config_for enum exactly — only these two values exist. */
export type JsConfigurationConfigFor = "header" | "footer";
export type JsConfigurationStatus = "active" | "inactive";

/**
 * Mirrors services/js-configuration.service.ts's jsConfigurationSelect
 * output exactly — no relations. `config_type` is a free-form VarChar(100)
 * string, NOT an enum (confirmed by reading the Prisma model and validator
 * directly — only `config_for` is a real enum). `config_code` is stored
 * LongText code, preserved exactly as submitted (the validator does not
 * even trim it).
 */
export type JsConfiguration = {
  id: number;
  config_for: JsConfigurationConfigFor;
  config_type: string;
  config_code: string;
  status: JsConfigurationStatus;
  created_at: string;
  updated_at: string;
};

/** Mirrors validators/js-configuration.validator.ts's listJsConfigurationsQuerySchema. */
export type ListJsConfigurationsFilter = {
  config_for?: JsConfigurationConfigFor;
  status?: JsConfigurationStatus;
};

/** Mirrors validators/js-configuration.validator.ts's createJsConfigurationSchema. */
export type CreateJsConfigurationInput = {
  config_for: JsConfigurationConfigFor;
  config_type: string;
  config_code: string;
  status?: JsConfigurationStatus;
};

export type UpdateJsConfigurationInput = Partial<CreateJsConfigurationInput>;
