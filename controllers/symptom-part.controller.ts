import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createSymptomPartSchema,
  listSymptomPartsQuerySchema,
  symptomPartIdParamSchema,
  updateSymptomPartSchema,
} from "@/validators/symptom-part.validator";
import {
  createSymptomPart,
  deleteSymptomPart,
  getSymptomPartById,
  getSymptomParts,
  SymptomPartHasActiveChildrenError,
  SymptomPartNotFoundError,
  updateSymptomPart,
} from "@/services/symptom-part.service";

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

  if (error instanceof SymptomPartNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof SymptomPartHasActiveChildrenError) {
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
      {
        success: false,
        message: "A symptom part with this SEO URL already exists",
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

export async function listSymptomPartsHandler(request: NextRequest) {
  try {
    await requirePermission("parts", "view");
    const query = listSymptomPartsQuerySchema.parse({
      status: request.nextUrl.searchParams.get("status") ?? undefined,
    });

    const symptomParts = await getSymptomParts(query);

    return NextResponse.json({ success: true, symptomParts });
  } catch (error) {
    return handleError(error);
  }
}

export async function createSymptomPartHandler(request: NextRequest) {
  try {
    await requirePermission("parts", "create");
    const body = await request.json();
    const data = createSymptomPartSchema.parse(body);
    const symptomPart = await createSymptomPart(data);

    return NextResponse.json(
      { success: true, symptomPart },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function getSymptomPartHandler(params: { id: string }) {
  try {
    await requirePermission("parts", "view");
    const { id } = symptomPartIdParamSchema.parse(params);
    const symptomPart = await getSymptomPartById(id);

    return NextResponse.json({ success: true, symptomPart });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateSymptomPartHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("parts", "update");
    const { id } = symptomPartIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateSymptomPartSchema.parse(body);
    const symptomPart = await updateSymptomPart(id, data);

    return NextResponse.json({ success: true, symptomPart });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteSymptomPartHandler(params: { id: string }) {
  try {
    await requirePermission("parts", "delete");
    const { id } = symptomPartIdParamSchema.parse(params);
    await deleteSymptomPart(id);

    return NextResponse.json({
      success: true,
      message: "Symptom part deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
