import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createJsConfigurationSchema,
  jsConfigurationIdParamSchema,
  listJsConfigurationsQuerySchema,
  updateJsConfigurationSchema,
} from "@/validators/js-configuration.validator";
import {
  createJsConfiguration,
  deleteJsConfiguration,
  getJsConfigurationById,
  getJsConfigurations,
  JsConfigurationNotFoundError,
  updateJsConfiguration,
} from "@/services/js-configuration.service";

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

  if (error instanceof JsConfigurationNotFoundError) {
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
        message: "A conflicting JS configuration record already exists",
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

export async function listJsConfigurationsHandler(request: NextRequest) {
  try {
    await requirePermission("js-configurations", "view");
    const params = request.nextUrl.searchParams;
    const query = listJsConfigurationsQuerySchema.parse({
      config_for: params.get("config_for") ?? undefined,
      status: params.get("status") ?? undefined,
    });

    const jsConfigurations = await getJsConfigurations(query);

    return NextResponse.json({ success: true, jsConfigurations });
  } catch (error) {
    return handleError(error);
  }
}

export async function createJsConfigurationHandler(request: NextRequest) {
  try {
    await requirePermission("js-configurations", "create");
    const body = await request.json();
    const data = createJsConfigurationSchema.parse(body);
    const jsConfiguration = await createJsConfiguration(data);

    return NextResponse.json(
      { success: true, jsConfiguration },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function getJsConfigurationHandler(params: { id: string }) {
  try {
    await requirePermission("js-configurations", "view");
    const { id } = jsConfigurationIdParamSchema.parse(params);
    const jsConfiguration = await getJsConfigurationById(id);

    return NextResponse.json({ success: true, jsConfiguration });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateJsConfigurationHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("js-configurations", "update");
    const { id } = jsConfigurationIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateJsConfigurationSchema.parse(body);
    const jsConfiguration = await updateJsConfiguration(id, data);

    return NextResponse.json({ success: true, jsConfiguration });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteJsConfigurationHandler(params: { id: string }) {
  try {
    await requirePermission("js-configurations", "delete");
    const { id } = jsConfigurationIdParamSchema.parse(params);
    await deleteJsConfiguration(id);

    return NextResponse.json({
      success: true,
      message: "JS configuration deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
