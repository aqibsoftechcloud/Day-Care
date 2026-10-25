import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createPageSchema,
  listPagesQuerySchema,
  pageIdParamSchema,
  updatePageSchema,
} from "@/validators/page.validator";
import {
  CityNotFoundError,
  createPage,
  deletePage,
  getPageById,
  getPages,
  LanguageNotFoundError,
  LocationCityMismatchError,
  LocationNotFoundError,
  PageCityRequiredError,
  PageNotFoundError,
  PageSeoUrlCityConflictError,
  ReservedPageSeoUrlError,
  updatePage,
} from "@/services/page.service";

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

  if (error instanceof PageCityRequiredError || error instanceof ReservedPageSeoUrlError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }

  if (error instanceof PageSeoUrlCityConflictError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 409 });
  }

  if (error instanceof LocationCityMismatchError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }

  if (error instanceof PageNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof LanguageNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof CityNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof LocationNotFoundError) {
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
      { success: false, message: "A page with this SEO URL already exists" },
      { status: 409 }
    );
  }

  console.error(error);

  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 }
  );
}

export async function listPages(request: NextRequest) {
  try {
    await requirePermission("pages", "view");
    const params = request.nextUrl.searchParams;
    const query = listPagesQuerySchema.parse({
      city_id: params.get("city_id") ?? undefined,
      scope: params.get("scope") ?? undefined,
      status: params.get("status") ?? undefined,
    });
    const pages = await getPages(query);
    return NextResponse.json({ success: true, pages });
  } catch (error) {
    return handleError(error);
  }
}

export async function createPageHandler(request: NextRequest) {
  try {
    await requirePermission("pages", "create");
    const body = await request.json();
    const data = createPageSchema.parse(body);
    const page = await createPage(data);

    return NextResponse.json({ success: true, page }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getPageHandler(params: { id: string }) {
  try {
    await requirePermission("pages", "view");
    const { id } = pageIdParamSchema.parse(params);
    const page = await getPageById(id);

    return NextResponse.json({ success: true, page });
  } catch (error) {
    return handleError(error);
  }
}

export async function updatePageHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("pages", "update");
    const { id } = pageIdParamSchema.parse(params);
    const body = await request.json();
    const data = updatePageSchema.parse(body);
    const page = await updatePage(id, data);

    return NextResponse.json({ success: true, page });
  } catch (error) {
    return handleError(error);
  }
}

export async function deletePageHandler(params: { id: string }) {
  try {
    await requirePermission("pages", "delete");
    const { id } = pageIdParamSchema.parse(params);
    await deletePage(id);

    return NextResponse.json({
      success: true,
      message: "Page deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
