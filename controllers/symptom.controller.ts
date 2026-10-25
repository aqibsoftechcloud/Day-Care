import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createSymptomSchema,
  listSymptomsQuerySchema,
  symptomIdParamSchema,
  updateSymptomSchema,
} from "@/validators/symptom.validator";
import {
  createSymptom,
  deleteSymptom,
  getSymptomById,
  getSymptoms,
  SymptomHasActiveChildrenError,
  SymptomNotFoundError,
  SymptomPartNotFoundError,
  updateSymptom,
} from "@/services/symptom.service";

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

  if (
    error instanceof SymptomNotFoundError ||
    error instanceof SymptomPartNotFoundError
  ) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof SymptomHasActiveChildrenError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 409 }
    );
  }

  console.error(error);

  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 }
  );
}

export async function listSymptomsHandler(request: NextRequest) {
  try {
    await requirePermission("symptoms", "view");
    const params = request.nextUrl.searchParams;
    const query = listSymptomsQuerySchema.parse({
      part_id: params.get("part_id") ?? undefined,
      status: params.get("status") ?? undefined,
    });

    const symptoms = await getSymptoms(query);

    return NextResponse.json({ success: true, symptoms });
  } catch (error) {
    return handleError(error);
  }
}

export async function createSymptomHandler(request: NextRequest) {
  try {
    await requirePermission("symptoms", "create");
    const body = await request.json();
    const data = createSymptomSchema.parse(body);
    const symptom = await createSymptom(data);

    return NextResponse.json({ success: true, symptom }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getSymptomHandler(params: { id: string }) {
  try {
    await requirePermission("symptoms", "view");
    const { id } = symptomIdParamSchema.parse(params);
    const symptom = await getSymptomById(id);

    return NextResponse.json({ success: true, symptom });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateSymptomHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("symptoms", "update");
    const { id } = symptomIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateSymptomSchema.parse(body);
    const symptom = await updateSymptom(id, data);

    return NextResponse.json({ success: true, symptom });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteSymptomHandler(params: { id: string }) {
  try {
    await requirePermission("symptoms", "delete");
    const { id } = symptomIdParamSchema.parse(params);
    await deleteSymptom(id);

    return NextResponse.json({
      success: true,
      message: "Symptom deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
