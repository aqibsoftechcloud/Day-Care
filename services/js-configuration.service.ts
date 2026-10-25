import { prisma } from "@/lib/prisma";
import type {
  CreateJsConfigurationInput,
  ListJsConfigurationsQuery,
  UpdateJsConfigurationInput,
} from "@/validators/js-configuration.validator";

export class JsConfigurationNotFoundError extends Error {
  constructor(id: number) {
    super(`JS configuration with id ${id} not found`);
    this.name = "JsConfigurationNotFoundError";
  }
}

const jsConfigurationSelect = {
  id: true,
  config_for: true,
  config_type: true,
  config_code: true,
  status: true,
  created_at: true,
  updated_at: true,
} as const;

export async function getJsConfigurations(
  filter?: ListJsConfigurationsQuery
) {
  return prisma.js_configurations.findMany({
    where: {
      ...(filter?.config_for !== undefined
        ? { config_for: filter.config_for }
        : {}),
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: jsConfigurationSelect,
    orderBy: { id: "asc" },
  });
}

export async function getJsConfigurationById(id: number) {
  const jsConfiguration = await prisma.js_configurations.findUnique({
    where: { id },
    select: jsConfigurationSelect,
  });

  if (!jsConfiguration) {
    throw new JsConfigurationNotFoundError(id);
  }

  return jsConfiguration;
}

export async function createJsConfiguration(
  data: CreateJsConfigurationInput
) {
  return prisma.js_configurations.create({
    data,
    select: jsConfigurationSelect,
  });
}

export async function updateJsConfiguration(
  id: number,
  data: UpdateJsConfigurationInput
) {
  const current = await prisma.js_configurations.findUnique({
    where: { id },
  });

  if (!current) {
    throw new JsConfigurationNotFoundError(id);
  }

  return prisma.js_configurations.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
    select: jsConfigurationSelect,
  });
}

/**
 * Soft delete: deactivates the JS configuration by setting status to
 * "inactive". Never physically deleted.
 */
export async function deleteJsConfiguration(id: number) {
  const current = await prisma.js_configurations.findUnique({
    where: { id },
  });

  if (!current) {
    throw new JsConfigurationNotFoundError(id);
  }

  await prisma.js_configurations.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
