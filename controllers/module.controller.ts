import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createModuleSchema,
  moduleIdParamSchema,
  updateModuleSchema,
} from "@/validators/module.validator";
import {
  createModule,
  deleteModule,
  DuplicateModuleNameError,
  getAllModules,
  getModuleById,
  InvalidParentModuleError,
  ModuleNotFoundError,
  ParentModuleNotFoundError,
  updateModule,
} from "@/services/module.service";

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

  if (error instanceof InvalidParentModuleError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }

  if (error instanceof ModuleNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof ParentModuleNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof DuplicateModuleNameError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 409 }
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      { success: false, message: "A module with this slug already exists" },
      { status: 409 }
    );
  }

  console.error(error);

  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 }
  );
}

export async function listModules() {
  try {
    await requirePermission("roles", "view");
    const modules = await getAllModules();
    return NextResponse.json({ success: true, modules });
  } catch (error) {
    return handleError(error);
  }
}

export async function createModuleHandler(request: NextRequest) {
  try {
    await requirePermission("roles", "create");
    const body = await request.json();
    const data = createModuleSchema.parse(body);
    const mod = await createModule(data);

    return NextResponse.json({ success: true, module: mod }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getModuleHandler(params: { id: string }) {
  try {
    await requirePermission("roles", "view");
    const { id } = moduleIdParamSchema.parse(params);
    const mod = await getModuleById(id);

    return NextResponse.json({ success: true, module: mod });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateModuleHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("roles", "update");
    const { id } = moduleIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateModuleSchema.parse(body);
    const mod = await updateModule(id, data);

    return NextResponse.json({ success: true, module: mod });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteModuleHandler(params: { id: string }) {
  try {
    await requirePermission("roles", "delete");
    const { id } = moduleIdParamSchema.parse(params);
    await deleteModule(id);

    return NextResponse.json({
      success: true,
      message: "Module deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
