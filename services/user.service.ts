import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encryptUserId } from "@/lib/user-id";
import type {
  CreateUserInput,
  UpdateUserInput,
} from "@/validators/user.validator";

const SALT_ROUNDS = 10;

export class UserNotFoundError extends Error {
  constructor() {
    super("User not found");
    this.name = "UserNotFoundError";
  }
}

export class RoleNotFoundError extends Error {
  constructor(roleId: number) {
    super(`Role with id ${roleId} not found`);
    this.name = "RoleNotFoundError";
  }
}

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role_id: number;
  status: string;
  created_at: Date;
  updated_at: Date;
};

function toSafeUser(user: UserRecord) {
  const { id, ...rest } = user;

  return { user_id: encryptUserId(id), ...rest };
}

async function ensureRoleExists(roleId: number) {
  const role = await prisma.roles.findUnique({ where: { id: roleId } });

  if (!role) {
    throw new RoleNotFoundError(roleId);
  }
}

export async function getAllUsers() {
  const users = await prisma.users.findMany({
    orderBy: { id: "asc" },
    omit: { password: true, session_version: true },
  });

  return users.map(toSafeUser);
}

export async function getUserById(id: number) {
  const user = await prisma.users.findUnique({
    where: { id },
    omit: { password: true, session_version: true },
  });

  if (!user) {
    throw new UserNotFoundError();
  }

  return toSafeUser(user);
}

export async function createUser(data: CreateUserInput) {
  await ensureRoleExists(data.role_id);

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.users.create({
    data: { ...data, password: hashedPassword },
    omit: { password: true, session_version: true },
  });

  return toSafeUser(user);
}

export async function updateUser(id: number, data: UpdateUserInput) {
  await getUserById(id);

  if (data.role_id !== undefined) {
    await ensureRoleExists(data.role_id);
  }

  const updateData = { ...data };
  let revokeSessions = false;

  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
    // A password change must end every session that was opened with the old one.
    revokeSessions = true;
  }

  const user = await prisma.users.update({
    where: { id },
    data: { ...updateData, ...(revokeSessions ? { session_version: { increment: 1 } } : {}) },
    omit: { password: true, session_version: true },
  });

  return toSafeUser(user);
}

/**
 * Soft delete: deactivates the user by setting status to "inactive".
 * The record, including its id, is never physically removed, so the
 * same user can later be reactivated via a status update.
 */
export async function deleteUser(id: number) {
  await getUserById(id);

  await prisma.users.update({
    where: { id },
    data: { status: "inactive" },
  });
}
