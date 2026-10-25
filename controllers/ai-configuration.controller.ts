import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import { AIConfigEncryptionKeyMissingError } from "@/lib/ai/encryption";
import {
  aiConfigurationIdParamSchema,
  createAIConfigurationSchema,
  listAIConfigurationsQuerySchema,
  updateAIConfigurationSchema,
} from "@/validators/ai-configuration.validator";
import {
  activateAIConfiguration,
  AIConfigurationIsActiveError,
  AIConfigurationNotFoundError,
  createAIConfiguration,
  deleteAIConfiguration,
  DisallowedBaseUrlError,
  getAIConfigurationById,
  getAIConfigurations,
  InactiveAIConfigurationError,
  updateAIConfiguration,
} from "@/services/ai-configuration.service";

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

  if (error instanceof DisallowedBaseUrlError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }

  if (error instanceof AIConfigurationNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (
    error instanceof AIConfigurationIsActiveError ||
    error instanceof InactiveAIConfigurationError
  ) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 409 }
    );
  }

  if (error instanceof AIConfigEncryptionKeyMissingError) {
    // A server misconfiguration, not something the admin can fix by
    // resubmitting the form — deliberately never surfaces key material.
    console.error("AI_CONFIG_ENCRYPTION_KEY is not configured");
    return NextResponse.json(
      { success: false, message: "AI configuration encryption is not set up on the server" },
      { status: 500 }
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "A conflicting AI configuration record already exists",
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

export async function listAIConfigurationsHandler(request: NextRequest) {
  try {
    await requirePermission("ai-configurations", "view");
    const params = request.nextUrl.searchParams;
    const query = listAIConfigurationsQuerySchema.parse({
      provider: params.get("provider") ?? undefined,
      status: params.get("status") ?? undefined,
    });

    const aiConfigurations = await getAIConfigurations(query);

    return NextResponse.json({ success: true, aiConfigurations });
  } catch (error) {
    return handleError(error);
  }
}

export async function createAIConfigurationHandler(request: NextRequest) {
  try {
    await requirePermission("ai-configurations", "create");
    const body = await request.json();
    const data = createAIConfigurationSchema.parse(body);
    const aiConfiguration = await createAIConfiguration(data);

    return NextResponse.json({ success: true, aiConfiguration }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getAIConfigurationHandler(params: { id: string }) {
  try {
    await requirePermission("ai-configurations", "view");
    const { id } = aiConfigurationIdParamSchema.parse(params);
    const aiConfiguration = await getAIConfigurationById(id);

    return NextResponse.json({ success: true, aiConfiguration });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateAIConfigurationHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("ai-configurations", "update");
    const { id } = aiConfigurationIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateAIConfigurationSchema.parse(body);
    const aiConfiguration = await updateAIConfiguration(id, data);

    return NextResponse.json({ success: true, aiConfiguration });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteAIConfigurationHandler(params: { id: string }) {
  try {
    await requirePermission("ai-configurations", "delete");
    const { id } = aiConfigurationIdParamSchema.parse(params);
    await deleteAIConfiguration(id);

    return NextResponse.json({
      success: true,
      message: "AI configuration deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function activateAIConfigurationHandler(params: { id: string }) {
  try {
    await requirePermission("ai-configurations", "update");
    const { id } = aiConfigurationIdParamSchema.parse(params);
    const aiConfiguration = await activateAIConfiguration(id);

    return NextResponse.json({ success: true, aiConfiguration });
  } catch (error) {
    return handleError(error);
  }
}
