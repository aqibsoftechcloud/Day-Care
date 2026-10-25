import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  bookaformDataIdParamSchema,
  listBookaformDataQuerySchema,
  updateBookaformDataSchema,
} from "@/validators/bookaform.validator";
import {
  BookaformDataNotFoundError,
  deleteBookaformData,
  getBookaformData,
  getBookaformDataById,
  updateBookaformData,
} from "@/services/bookaform.service";

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

  if (error instanceof BookaformDataNotFoundError) {
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

export async function listBookaformDataHandler(request: NextRequest) {
  try {
    await requirePermission("book-a-form-data", "view");
    const query = listBookaformDataQuerySchema.parse({
      status: request.nextUrl.searchParams.get("status") ?? undefined,
    });

    const bookaformDataList = await getBookaformData(query);

    return NextResponse.json({ success: true, bookaformDataList });
  } catch (error) {
    return handleError(error);
  }
}

export async function getBookaformDataHandler(params: { id: string }) {
  try {
    await requirePermission("book-a-form-data", "view");
    const { id } = bookaformDataIdParamSchema.parse(params);
    const bookaformData = await getBookaformDataById(id);

    return NextResponse.json({ success: true, bookaformData });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateBookaformDataHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("book-a-form-data", "update");
    const { id } = bookaformDataIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateBookaformDataSchema.parse(body);
    const bookaformData = await updateBookaformData(id, data);

    return NextResponse.json({ success: true, bookaformData });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteBookaformDataHandler(params: { id: string }) {
  try {
    await requirePermission("book-a-form-data", "delete");
    const { id } = bookaformDataIdParamSchema.parse(params);
    await deleteBookaformData(id);

    return NextResponse.json({
      success: true,
      message: "Book-a-Form submission deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
