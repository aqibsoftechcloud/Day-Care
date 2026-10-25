import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createPermissionSchema,
  permissionIdParamSchema,
  updatePermissionSchema,
} from "@/validators/permission.validator";
import {
  ActionNotFoundError,
  createPermission,
  deletePermission,
  getAllPermissions,
  getPermissionById,
  ModuleNotFoundError,
  PermissionNotFoundError,
  updatePermission,
} from "@/services/permission.service";

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

  if (error instanceof PermissionNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof ModuleNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof ActionNotFoundError) {
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
      {
        success: false,
        message:
          "A permission with this name, or for this module/action pair, already exists",
      },
      { status: 409 }
    );
  }

  console.error(error);

  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 }
  );
}

export async function listPermissions() {
  try {
    await requirePermission("roles", "view");
    const permissions = await getAllPermissions();
    return NextResponse.json({ success: true, permissions });
  } catch (error) {
    return handleError(error);
  }
}

export async function createPermissionHandler(request: NextRequest) {
  try {
    await requirePermission("roles", "create");
    const body = await request.json();
    const data = createPermissionSchema.parse(body);
    const permission = await createPermission(data);

    return NextResponse.json(
      { success: true, permission },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function getPermissionHandler(params: { id: string }) {
  try {
    await requirePermission("roles", "view");
    const { id } = permissionIdParamSchema.parse(params);
    const permission = await getPermissionById(id);

    return NextResponse.json({ success: true, permission });
  } catch (error) {
    return handleError(error);
  }
}

export async function updatePermissionHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("roles", "update");
    const { id } = permissionIdParamSchema.parse(params);
    const body = await request.json();
    const data = updatePermissionSchema.parse(body);
    const permission = await updatePermission(id, data);

    return NextResponse.json({ success: true, permission });
  } catch (error) {
    return handleError(error);
  }
}

export async function deletePermissionHandler(params: { id: string }) {
  try {
    await requirePermission("roles", "delete");
    const { id } = permissionIdParamSchema.parse(params);
    await deletePermission(id);

    return NextResponse.json({
      success: true,
      message: "Permission deleted",
    });
  } catch (error) {
    return handleError(error);
  }
}
