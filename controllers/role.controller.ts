import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createRoleSchema,
  roleIdParamSchema,
  updateRoleSchema,
} from "@/validators/role.validator";
import {
  createRole,
  deleteRole,
  getAllRoles,
  getRoleById,
  RoleNotFoundError,
  updateRole,
} from "@/services/role.service";

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

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      { success: false, message: "A role with this name already exists" },
      { status: 409 }
    );
  }

  console.error(error);

  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 }
  );
}

export async function listRoles() {
  try {
    await requirePermission("roles", "view");
    const roles = await getAllRoles();
    return NextResponse.json({ success: true, roles });
  } catch (error) {
    return handleError(error);
  }
}

export async function createRoleHandler(request: NextRequest) {
  try {
    await requirePermission("roles", "create");
    const body = await request.json();
    const data = createRoleSchema.parse(body);
    const role = await createRole(data);

    return NextResponse.json({ success: true, role }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getRoleHandler(params: { id: string }) {
  try {
    await requirePermission("roles", "view");
    const { id } = roleIdParamSchema.parse(params);
    const role = await getRoleById(id);

    return NextResponse.json({ success: true, role });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateRoleHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("roles", "update");
    const { id } = roleIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateRoleSchema.parse(body);
    const role = await updateRole(id, data);

    return NextResponse.json({ success: true, role });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteRoleHandler(params: { id: string }) {
  try {
    await requirePermission("roles", "delete");
    const { id } = roleIdParamSchema.parse(params);
    await deleteRole(id);

    return NextResponse.json({ success: true, message: "Role deleted" });
  } catch (error) {
    return handleError(error);
  }
}
