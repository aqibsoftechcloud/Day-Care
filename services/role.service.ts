import { prisma } from "@/lib/prisma";
import type {
  CreateRoleInput,
  UpdateRoleInput,
} from "@/validators/role.validator";

export class RoleNotFoundError extends Error {
  constructor(id: number) {
    super(`Role with id ${id} not found`);
    this.name = "RoleNotFoundError";
  }
}

export function getAllRoles() {
  return prisma.roles.findMany({
    orderBy: { id: "asc" },
  });
}

export async function getRoleById(id: number) {
  const role = await prisma.roles.findUnique({ where: { id } });

  if (!role) {
    throw new RoleNotFoundError(id);
  }

  return role;
}

export function createRole(data: CreateRoleInput) {
  return prisma.roles.create({ data });
}

export async function updateRole(id: number, data: UpdateRoleInput) {
  await getRoleById(id);

  return prisma.roles.update({ where: { id }, data });
}

export async function deleteRole(id: number) {
  await getRoleById(id);

  await prisma.roles.delete({ where: { id } });
}
