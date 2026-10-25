import { prisma } from "@/lib/prisma";
import type {
  CreatePermissionInput,
  UpdatePermissionInput,
} from "@/validators/permission.validator";

export class PermissionNotFoundError extends Error {
  constructor(id: number) {
    super(`Permission with id ${id} not found`);
    this.name = "PermissionNotFoundError";
  }
}

export class ModuleNotFoundError extends Error {
  constructor(moduleId: number) {
    super(`Module with id ${moduleId} not found`);
    this.name = "ModuleNotFoundError";
  }
}

export class ActionNotFoundError extends Error {
  constructor(actionId: number) {
    super(`Action with id ${actionId} not found`);
    this.name = "ActionNotFoundError";
  }
}

const permissionSelect = {
  id: true,
  module_id: true,
  action_id: true,
  name: true,
  created_at: true,
  modules: { select: { id: true, name: true, slug: true } },
  actions: { select: { id: true, name: true, slug: true } },
} as const;

type PermissionRecord = {
  id: number;
  module_id: number;
  action_id: number;
  name: string;
  created_at: Date;
  modules: { id: number; name: string; slug: string };
  actions: { id: number; name: string; slug: string };
};

function toSafePermission(permission: PermissionRecord) {
  const { modules, actions, ...rest } = permission;

  return { ...rest, module: modules, action: actions };
}

async function ensureModuleExists(moduleId: number) {
  const mod = await prisma.modules.findUnique({ where: { id: moduleId } });

  if (!mod) {
    throw new ModuleNotFoundError(moduleId);
  }
}

async function ensureActionExists(actionId: number) {
  const action = await prisma.actions.findUnique({ where: { id: actionId } });

  if (!action) {
    throw new ActionNotFoundError(actionId);
  }
}

export async function getAllPermissions() {
  const permissions = await prisma.permissions.findMany({
    select: permissionSelect,
    orderBy: { id: "asc" },
  });

  return permissions.map(toSafePermission);
}

export async function getPermissionById(id: number) {
  const permission = await prisma.permissions.findUnique({
    where: { id },
    select: permissionSelect,
  });

  if (!permission) {
    throw new PermissionNotFoundError(id);
  }

  return toSafePermission(permission);
}

export async function createPermission(data: CreatePermissionInput) {
  await ensureModuleExists(data.module_id);
  await ensureActionExists(data.action_id);

  const permission = await prisma.permissions.create({
    data,
    select: permissionSelect,
  });

  return toSafePermission(permission);
}

export async function updatePermission(
  id: number,
  data: UpdatePermissionInput
) {
  await getPermissionById(id);

  if (data.module_id !== undefined) {
    await ensureModuleExists(data.module_id);
  }

  if (data.action_id !== undefined) {
    await ensureActionExists(data.action_id);
  }

  const permission = await prisma.permissions.update({
    where: { id },
    data,
    select: permissionSelect,
  });

  return toSafePermission(permission);
}

/**
 * The `permissions` table has no status/soft-delete column, so this is a
 * real delete. The existing database defines `role_permissions.permission_id`
 * with `onDelete: Cascade`, so deleting a permission also removes every
 * role_permissions mapping built on it.
 */
export async function deletePermission(id: number) {
  await getPermissionById(id);

  await prisma.permissions.delete({ where: { id } });
}
