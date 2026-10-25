import { prisma } from "@/lib/prisma";
import { encryptApiKey } from "@/lib/ai/encryption";
import { PROVIDER_HOST_ALLOWLIST } from "@/lib/ai/providers/registry";
import type { AIProviderName } from "@/lib/ai/providers/types";
import type {
  CreateAIConfigurationInput,
  ListAIConfigurationsQuery,
  UpdateAIConfigurationInput,
} from "@/validators/ai-configuration.validator";

export class AIConfigurationNotFoundError extends Error {
  constructor(id: number) {
    super(`AI configuration with id ${id} not found`);
    this.name = "AIConfigurationNotFoundError";
  }
}

export class DisallowedBaseUrlError extends Error {
  constructor(provider: string, baseUrl: string) {
    super(`"${baseUrl}" is not an allowed base URL for provider "${provider}"`);
    this.name = "DisallowedBaseUrlError";
  }
}

export class AIConfigurationIsActiveError extends Error {
  constructor(id: number) {
    super(`AI configuration with id ${id} is the active provider and cannot be deleted — activate a different configuration first`);
    this.name = "AIConfigurationIsActiveError";
  }
}

export class InactiveAIConfigurationError extends Error {
  constructor(id: number) {
    super(`AI configuration with id ${id} is inactive and cannot be activated — reactivate it first`);
    this.name = "InactiveAIConfigurationError";
  }
}

const aiConfigurationSelect = {
  id: true,
  provider: true,
  base_url: true,
  model: true,
  encrypted_api_key: true,
  is_active: true,
  status: true,
  created_at: true,
  updated_at: true,
} as const;

type AIConfigurationRecord = {
  id: number;
  provider: string;
  base_url: string;
  model: string;
  encrypted_api_key: string | null;
  is_active: boolean;
  status: string;
  created_at: Date;
  updated_at: Date;
};

/**
 * Strips `encrypted_api_key` and derives `has_api_key` — the one place
 * that decides what an AI configuration looks like outside this service.
 * Every controller response goes through this; nothing else in the
 * codebase is allowed to read `encrypted_api_key` off a Prisma result.
 */
function toSafeAIConfiguration(config: AIConfigurationRecord) {
  const { encrypted_api_key, ...rest } = config;

  return { ...rest, has_api_key: encrypted_api_key !== null };
}

/** Syntactic base_url validation happens in the Zod schema; this is the provider-aware allowlist check (needs the *effective* provider, which a partial update may not include). */
function ensureBaseUrlAllowedForProvider(provider: AIProviderName, baseUrl: string) {
  let hostname: string;

  try {
    hostname = new URL(baseUrl).hostname;
  } catch {
    throw new DisallowedBaseUrlError(provider, baseUrl);
  }

  const allowedHosts = PROVIDER_HOST_ALLOWLIST[provider];

  if (!allowedHosts.includes(hostname)) {
    throw new DisallowedBaseUrlError(provider, baseUrl);
  }
}

export async function getAIConfigurations(filter?: ListAIConfigurationsQuery) {
  const configurations = await prisma.ai_configurations.findMany({
    where: {
      ...(filter?.provider !== undefined ? { provider: filter.provider } : {}),
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: aiConfigurationSelect,
    orderBy: { id: "asc" },
  });

  return configurations.map(toSafeAIConfiguration);
}

export async function getAIConfigurationById(id: number) {
  const configuration = await prisma.ai_configurations.findUnique({
    where: { id },
    select: aiConfigurationSelect,
  });

  if (!configuration) {
    throw new AIConfigurationNotFoundError(id);
  }

  return toSafeAIConfiguration(configuration);
}

/**
 * Server-only — returns the raw row including `encrypted_api_key`. Used
 * exclusively by services/ai.service.ts, immediately before decrypting the
 * key to make a provider call. Never exposed through a controller.
 */
export async function getActiveAIConfigurationRaw() {
  return prisma.ai_configurations.findFirst({
    where: { is_active: true, status: "active" },
    select: aiConfigurationSelect,
  });
}

export async function createAIConfiguration(data: CreateAIConfigurationInput) {
  ensureBaseUrlAllowedForProvider(data.provider, data.base_url);

  const { api_key, ...rest } = data;

  const configuration = await prisma.ai_configurations.create({
    data: {
      ...rest,
      encrypted_api_key: api_key ? encryptApiKey(api_key) : null,
    },
    select: aiConfigurationSelect,
  });

  return toSafeAIConfiguration(configuration);
}

export async function updateAIConfiguration(id: number, data: UpdateAIConfigurationInput) {
  const current = await prisma.ai_configurations.findUnique({ where: { id } });

  if (!current) {
    throw new AIConfigurationNotFoundError(id);
  }

  const effectiveProvider = (data.provider ?? current.provider) as AIProviderName;
  const effectiveBaseUrl = data.base_url ?? current.base_url;

  if (data.provider !== undefined || data.base_url !== undefined) {
    ensureBaseUrlAllowedForProvider(effectiveProvider, effectiveBaseUrl);
  }

  const { api_key, ...rest } = data;

  const configuration = await prisma.ai_configurations.update({
    where: { id },
    data: {
      ...rest,
      ...(api_key !== undefined ? { encrypted_api_key: encryptApiKey(api_key) } : {}),
      updated_at: new Date(),
    },
    select: aiConfigurationSelect,
  });

  return toSafeAIConfiguration(configuration);
}

/**
 * Soft delete: deactivates the configuration by setting status to
 * "inactive". Refuses to delete the currently active configuration — the
 * admin must activate a different one first, so the system is never left
 * mid-request with `is_active: true` pointing at a deleted row.
 */
export async function deleteAIConfiguration(id: number) {
  const current = await prisma.ai_configurations.findUnique({ where: { id } });

  if (!current) {
    throw new AIConfigurationNotFoundError(id);
  }

  if (current.is_active) {
    throw new AIConfigurationIsActiveError(id);
  }

  await prisma.ai_configurations.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}

/**
 * Activates exactly one configuration, deactivating every other row, in a
 * single transaction — the DB-level invariant "at most one is_active row"
 * is enforced here, not by a unique constraint (MySQL has no partial/
 * filtered unique index), matching how this codebase already enforces
 * other cross-row rules (e.g. the menu parent-cycle check) in the service
 * layer rather than the schema.
 */
export async function activateAIConfiguration(id: number) {
  const current = await prisma.ai_configurations.findUnique({ where: { id } });

  if (!current) {
    throw new AIConfigurationNotFoundError(id);
  }

  if (current.status === "inactive") {
    throw new InactiveAIConfigurationError(id);
  }

  const [, activated] = await prisma.$transaction([
    prisma.ai_configurations.updateMany({
      where: { id: { not: id }, is_active: true },
      data: { is_active: false, updated_at: new Date() },
    }),
    prisma.ai_configurations.update({
      where: { id },
      data: { is_active: true, updated_at: new Date() },
      select: aiConfigurationSelect,
    }),
  ]);

  return toSafeAIConfiguration(activated);
}
