import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createMenuSchema,
  listMenusQuerySchema,
  menuIdParamSchema,
  updateMenuSchema,
} from "@/validators/menu.validator";
import {
  CityNotFoundError,
  createMenu,
  deleteMenu,
  getMenuById,
  getMenus,
  InactiveMenuTargetError,
  InvalidMenuTargetError,
  InvalidParentMenuError,
  LanguageNotFoundError,
  MenuHasActiveChildrenError,
  MenuNotFoundError,
  MenuTargetCityMismatchError,
  MenuTargetNotFoundError,
  ParentMenuCityMismatchError,
  ParentMenuNotFoundError,
  updateMenu,
} from "@/services/menu.service";

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

  if (error instanceof InvalidParentMenuError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }

  if (error instanceof InvalidMenuTargetError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }

  if (error instanceof InactiveMenuTargetError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }

  if (error instanceof MenuTargetCityMismatchError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }

  if (error instanceof MenuTargetNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof MenuNotFoundError) {
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

  if (error instanceof ParentMenuNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof ParentMenuCityMismatchError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }

  if (error instanceof MenuHasActiveChildrenError) {
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
      { success: false, message: "A menu with this SEO URL already exists" },
      { status: 409 }
    );
  }

  console.error(error);

  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 }
  );
}

export async function listMenus(request: NextRequest) {
  try {
    await requirePermission("menu-management", "view");
    const params = request.nextUrl.searchParams;
    const query = listMenusQuerySchema.parse({
      status: params.get("status") ?? undefined,
      language_id: params.get("language_id") ?? undefined,
      city_id: params.get("city_id") ?? undefined,
      cityIdIsNull: params.get("cityIdIsNull") === "true" ? true : undefined,
      parent_id: params.get("parent_id") ?? undefined,
    });

    const menus = await getMenus(query);
    return NextResponse.json({ success: true, menus });
  } catch (error) {
    return handleError(error);
  }
}

export async function createMenuHandler(request: NextRequest) {
  try {
    await requirePermission("menu-management", "create");
    const body = await request.json();
    const data = createMenuSchema.parse(body);
    const menu = await createMenu(data);

    return NextResponse.json({ success: true, menu }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getMenuHandler(params: { id: string }) {
  try {
    await requirePermission("menu-management", "view");
    const { id } = menuIdParamSchema.parse(params);
    const menu = await getMenuById(id);

    return NextResponse.json({ success: true, menu });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateMenuHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("menu-management", "update");
    const { id } = menuIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateMenuSchema.parse(body);
    const menu = await updateMenu(id, data);

    return NextResponse.json({ success: true, menu });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteMenuHandler(params: { id: string }) {
  try {
    await requirePermission("menu-management", "delete");
    const { id } = menuIdParamSchema.parse(params);
    await deleteMenu(id);

    return NextResponse.json({
      success: true,
      message: "Menu deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
