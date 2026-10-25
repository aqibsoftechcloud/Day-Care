import { prisma } from "@/lib/prisma";
import type { SyncRolePermissionsInput } from "@/validators/role-permission.validator";

export class RoleNotFoundError extends Error {
  constructor(id: number) {
    super(`Role with id ${id} not found`);
    this.name = "RoleNotFoundError";
  }
}

export class PermissionNotFoundError extends Error {
  constructor(id: number) {
    super(`Permission with id ${id} not found`);
    this.name = "PermissionNotFoundError";
  }
}

async function ensureRoleExists(roleId: number) {
  const role = await prisma.roles.findUnique({ where: { id: roleId } });

  if (!role) {
    throw new RoleNotFoundError(roleId);
  }
}

async function ensurePermissionsExist(permissionIds: number[]) {
  if (permissionIds.length === 0) return;

  const found = await prisma.permissions.findMany({
    where: { id: { in: permissionIds } },
    select: { id: true },
  });

  const foundIds = new Set(found.map((permission) => permission.id));
  const missing = permissionIds.find((id) => !foundIds.has(id));

  if (missing !== undefined) {
    throw new PermissionNotFoundError(missing);
  }
}

export async function getRolePermissions(roleId: number) {
  await ensureRoleExists(roleId);

  return prisma.role_permissions.findMany({
    where: { role_id: roleId },
    select: {
      permission_id: true,
      permissions: {
        select: {
          id: true,
          name: true,
          module_id: true,
          action_id: true,
        },
      },
    },
    orderBy: { permission_id: "asc" },
  });
}

/**
 * Replaces the full set of permissions assigned to a role with the given
 * list: adds mappings that are missing, removes mappings no longer present,
 * and leaves unchanged mappings untouched. Runs as a single transaction so
 * the role's permission set is never left partially synchronized.
 */
export async function syncRolePermissions(
  roleId: number,
  data: SyncRolePermissionsInput
) {
  await ensureRoleExists(roleId);
  await ensurePermissionsExist(data.permission_ids);

  const existing = await prisma.role_permissions.findMany({
    where: { role_id: roleId },
    select: { permission_id: true },
  });

  const existingIds = new Set(existing.map((row) => row.permission_id));
  const nextIds = new Set(data.permission_ids);

  const toAdd = data.permission_ids.filter((id) => !existingIds.has(id));
  const toRemove = [...existingIds].filter((id) => !nextIds.has(id));

  await prisma.$transaction([
    ...(toRemove.length > 0
      ? [
          prisma.role_permissions.deleteMany({
            where: { role_id: roleId, permission_id: { in: toRemove } },
          }),
        ]
      : []),
    ...(toAdd.length > 0
      ? [
          prisma.role_permissions.createMany({
            data: toAdd.map((permission_id) => ({
              role_id: roleId,
              permission_id,
            })),
          }),
        ]
      : []),
  ]);

  return getRolePermissions(roleId);
}
