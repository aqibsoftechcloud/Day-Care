import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  rolePermissionsParamSchema,
  syncRolePermissionsSchema,
} from "@/validators/role-permission.validator";
import {
  getRolePermissions,
  PermissionNotFoundError,
  RoleNotFoundError,
  syncRolePermissions,
} from "@/services/role-permission.service";

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

  if (error instanceof RoleNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof PermissionNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  console.error(error);

  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 }
  );
}

export async function getRolePermissionsHandler(params: { id: string }) {
  try {
    await requirePermission("roles", "view");
    const { id } = rolePermissionsParamSchema.parse(params);
    const permissions = await getRolePermissions(id);

    return NextResponse.json({ success: true, permissions });
  } catch (error) {
    return handleError(error);
  }
}

export async function syncRolePermissionsHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("roles", "update");
    const { id } = rolePermissionsParamSchema.parse(params);
    const body = await request.json();
    const data = syncRolePermissionsSchema.parse(body);
    const permissions = await syncRolePermissions(id, data);

    return NextResponse.json({ success: true, permissions });
  } catch (error) {
    return handleError(error);
  }
}
