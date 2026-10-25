import { prisma } from "@/lib/prisma";
import type {
  CreateModuleInput,
  UpdateModuleInput,
} from "@/validators/module.validator";

export class ModuleNotFoundError extends Error {
  constructor(id: number) {
    super(`Module with id ${id} not found`);
    this.name = "ModuleNotFoundError";
  }
}

export class ParentModuleNotFoundError extends Error {
  constructor(parentId: number) {
    super(`Parent module with id ${parentId} not found`);
    this.name = "ParentModuleNotFoundError";
  }
}

export class InvalidParentModuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidParentModuleError";
  }
}

export class DuplicateModuleNameError extends Error {
  constructor(name: string) {
    super(`A module named "${name}" already exists under the same parent`);
    this.name = "DuplicateModuleNameError";
  }
}

const moduleListSelect = {
  id: true,
  parent_id: true,
  name: true,
  slug: true,
  sorting_order: true,
  status: true,
  created_at: true,
  updated_at: true,
} as const;

type ModuleRow = {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  sorting_order: number;
  status: string;
  created_at: Date;
  updated_at: Date;
};

type ModuleNode = ModuleRow & { children: ModuleNode[] };

function buildModuleTree(rows: ModuleRow[]): ModuleNode[] {
  const nodeMap = new Map<number, ModuleNode>();

  for (const row of rows) {
    nodeMap.set(row.id, { ...row, children: [] });
  }

  const roots: ModuleNode[] = [];

  for (const row of rows) {
    const node = nodeMap.get(row.id)!;

    if (row.parent_id !== null && nodeMap.has(row.parent_id)) {
      nodeMap.get(row.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

async function ensureParentExists(parentId: number) {
  const parent = await prisma.modules.findUnique({ where: { id: parentId } });

  if (!parent) {
    throw new ParentModuleNotFoundError(parentId);
  }
}

/**
 * Walks the proposed parent's ancestor chain to make sure `id` does not
 * appear in it, which would otherwise create a circular hierarchy.
 */
async function ensureNoCycle(id: number, parentId: number) {
  if (parentId === id) {
    throw new InvalidParentModuleError("A module cannot be its own parent");
  }

  let currentId: number | null = parentId;
  const visited = new Set<number>();

  while (currentId !== null) {
    if (currentId === id) {
      throw new InvalidParentModuleError(
        "Invalid parent: this would create a circular module hierarchy"
      );
    }

    if (visited.has(currentId)) break;
    visited.add(currentId);

    const current: { parent_id: number | null } | null =
      await prisma.modules.findUnique({
        where: { id: currentId },
        select: { parent_id: true },
      });

    currentId = current?.parent_id ?? null;
  }
}

async function ensureUniqueName(
  name: string,
  parentId: number | null,
  excludeId?: number
) {
  const existing = await prisma.modules.findFirst({
    where: {
      name,
      parent_id: parentId,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  if (existing) {
    throw new DuplicateModuleNameError(name);
  }
}

export async function getAllModules() {
  const modules = await prisma.modules.findMany({
    select: moduleListSelect,
    orderBy: [{ sorting_order: "asc" }, { name: "asc" }],
  });

  return buildModuleTree(modules);
}

export async function getModuleById(id: number) {
  const record = await prisma.modules.findUnique({
    where: { id },
    select: {
      ...moduleListSelect,
      modules: { select: moduleListSelect },
      other_modules: {
        select: moduleListSelect,
        orderBy: [{ sorting_order: "asc" }, { name: "asc" }],
      },
    },
  });

  if (!record) {
    throw new ModuleNotFoundError(id);
  }

  const { modules: parent, other_modules: children, ...rest } = record;

  return { ...rest, parent: parent ?? null, children };
}

export async function createModule(data: CreateModuleInput) {
  const parentId = data.parent_id ?? null;

  if (parentId !== null) {
    await ensureParentExists(parentId);
  }

  await ensureUniqueName(data.name, parentId);

  return prisma.modules.create({
    data,
    select: moduleListSelect,
  });
}

export async function updateModule(id: number, data: UpdateModuleInput) {
  const current = await prisma.modules.findUnique({ where: { id } });

  if (!current) {
    throw new ModuleNotFoundError(id);
  }

  const nextParentId =
    data.parent_id !== undefined ? data.parent_id : current.parent_id;

  if (nextParentId !== null) {
    await ensureParentExists(nextParentId);
    await ensureNoCycle(id, nextParentId);
  }

  if (data.name !== undefined || data.parent_id !== undefined) {
    const nameToCheck = data.name ?? current.name;
    await ensureUniqueName(nameToCheck, nextParentId, id);
  }

  return prisma.modules.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
    select: moduleListSelect,
  });
}

/**
 * Soft delete: deactivates the module by setting status to "inactive".
 * Modules are never physically removed since permissions may reference
 * them, so the same module can later be reactivated via a status update.
 */
export async function deleteModule(id: number) {
  const current = await prisma.modules.findUnique({ where: { id } });

  if (!current) {
    throw new ModuleNotFoundError(id);
  }

  await prisma.modules.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
