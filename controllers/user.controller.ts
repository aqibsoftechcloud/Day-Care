import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import { decryptUserId, InvalidUserIdError } from "@/lib/user-id";
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from "@/validators/user.validator";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  RoleNotFoundError,
  updateUser,
  UserNotFoundError,
} from "@/services/user.service";

function handleError(error: unknown) {
  const authResponse = tryHandleAuthorizationError(error);
  if (authResponse) {
    return authResponse;
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: "Validation failed",
        errors: error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  if (error instanceof InvalidUserIdError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }

  if (error instanceof UserNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof RoleNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      { success: false, message: "A user with this email already exists" },
      { status: 409 }
    );
  }

  console.error(error);

  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 }
  );
}

export async function listUsers() {
  try {
    await requirePermission("users", "view");
    const users = await getAllUsers();
    return NextResponse.json({ success: true, users });
  } catch (error) {
    return handleError(error);
  }
}

export async function createUserHandler(request: NextRequest) {
  try {
    await requirePermission("users", "create");
    const body = await request.json();
    const data = createUserSchema.parse(body);
    const user = await createUser(data);

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getUserHandler(params: { id: string }) {
  try {
    await requirePermission("users", "view");
    const { id: encryptedId } = userIdParamSchema.parse(params);
    const id = decryptUserId(encryptedId);
    const user = await getUserById(id);

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateUserHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("users", "update");
    const { id: encryptedId } = userIdParamSchema.parse(params);
    const id = decryptUserId(encryptedId);
    const body = await request.json();
    const data = updateUserSchema.parse(body);
    const user = await updateUser(id, data);

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteUserHandler(params: { id: string }) {
  try {
    await requirePermission("users", "delete");
    const { id: encryptedId } = userIdParamSchema.parse(params);
    const id = decryptUserId(encryptedId);
    await deleteUser(id);

    return NextResponse.json({ success: true, message: "User deactivated" });
  } catch (error) {
    return handleError(error);
  }
}
