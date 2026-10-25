import { prisma } from "@/lib/prisma";
import type {
  CreateActionInput,
  UpdateActionInput,
} from "@/validators/action.validator";

export class ActionNotFoundError extends Error {
  constructor(id: number) {
    super(`Action with id ${id} not found`);
    this.name = "ActionNotFoundError";
  }
}

export function getAllActions() {
  return prisma.actions.findMany({
    orderBy: { id: "asc" },
  });
}

export async function getActionById(id: number) {
  const action = await prisma.actions.findUnique({ where: { id } });

  if (!action) {
    throw new ActionNotFoundError(id);
  }

  return action;
}

export function createAction(data: CreateActionInput) {
  return prisma.actions.create({ data });
}

export async function updateAction(id: number, data: UpdateActionInput) {
  await getActionById(id);

  return prisma.actions.update({ where: { id }, data });
}

/**
 * The `actions` table has no status/soft-delete column, so this is a real
 * delete. The existing database defines `permissions.action_id` with
 * `onDelete: Cascade`, so deleting an action also removes every permission
 * (and, transitively, every role_permissions mapping) built on it.
 */
export async function deleteAction(id: number) {
  await getActionById(id);

  await prisma.actions.delete({ where: { id } });
}
