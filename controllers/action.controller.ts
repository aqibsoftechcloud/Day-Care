import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  actionIdParamSchema,
  createActionSchema,
  updateActionSchema,
} from "@/validators/action.validator";
import {
  ActionNotFoundError,
  createAction,
  deleteAction,
  getActionById,
  getAllActions,
  updateAction,
} from "@/services/action.service";

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
      { success: false, message: "An action with this name or slug already exists" },
      { status: 409 }
    );
  }

  console.error(error);

  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 }
  );
}

export async function listActions() {
  try {
    await requirePermission("roles", "view");
    const actions = await getAllActions();
    return NextResponse.json({ success: true, actions });
  } catch (error) {
    return handleError(error);
  }
}

export async function createActionHandler(request: NextRequest) {
  try {
    await requirePermission("roles", "create");
    const body = await request.json();
    const data = createActionSchema.parse(body);
    const action = await createAction(data);

    return NextResponse.json({ success: true, action }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getActionHandler(params: { id: string }) {
  try {
    await requirePermission("roles", "view");
    const { id } = actionIdParamSchema.parse(params);
    const action = await getActionById(id);

    return NextResponse.json({ success: true, action });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateActionHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("roles", "update");
    const { id } = actionIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateActionSchema.parse(body);
    const action = await updateAction(id, data);

    return NextResponse.json({ success: true, action });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteActionHandler(params: { id: string }) {
  try {
    await requirePermission("roles", "delete");
    const { id } = actionIdParamSchema.parse(params);
    await deleteAction(id);

    return NextResponse.json({ success: true, message: "Action deleted" });
  } catch (error) {
    return handleError(error);
  }
}
