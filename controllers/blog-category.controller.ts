import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  blogCategoryIdParamSchema,
  createBlogCategorySchema,
  listBlogCategoriesQuerySchema,
  updateBlogCategorySchema,
} from "@/validators/blog-category.validator";
import {
  BlogCategoryHasActiveBlogsError,
  BlogCategoryNotFoundError,
  createBlogCategory,
  deleteBlogCategory,
  getBlogCategories,
  getBlogCategoryById,
  updateBlogCategory,
} from "@/services/blog-category.service";
import { GlobalSpecialityNotFoundError, GlobalTreatmentNotFoundError } from "@/services/blog.service";

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

  if (error instanceof BlogCategoryNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof BlogCategoryHasActiveBlogsError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 409 }
    );
  }

  if (error instanceof GlobalSpecialityNotFoundError || error instanceof GlobalTreatmentNotFoundError) {
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
        message: "A blog category with this SEO URL already exists",
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

export async function listBlogCategoriesHandler(request: NextRequest) {
  try {
    await requirePermission("blog-categories", "view");
    const query = listBlogCategoriesQuerySchema.parse({
      status: request.nextUrl.searchParams.get("status") ?? undefined,
    });

    const blogCategories = await getBlogCategories(query);

    return NextResponse.json({ success: true, blogCategories });
  } catch (error) {
    return handleError(error);
  }
}

export async function createBlogCategoryHandler(request: NextRequest) {
  try {
    await requirePermission("blog-categories", "create");
    const body = await request.json();
    const data = createBlogCategorySchema.parse(body);
    const blogCategory = await createBlogCategory(data);

    return NextResponse.json(
      { success: true, blogCategory },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function getBlogCategoryHandler(params: { id: string }) {
  try {
    await requirePermission("blog-categories", "view");
    const { id } = blogCategoryIdParamSchema.parse(params);
    const blogCategory = await getBlogCategoryById(id);

    return NextResponse.json({ success: true, blogCategory });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateBlogCategoryHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("blog-categories", "update");
    const { id } = blogCategoryIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateBlogCategorySchema.parse(body);
    const blogCategory = await updateBlogCategory(id, data);

    return NextResponse.json({ success: true, blogCategory });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteBlogCategoryHandler(params: { id: string }) {
  try {
    await requirePermission("blog-categories", "delete");
    const { id } = blogCategoryIdParamSchema.parse(params);
    await deleteBlogCategory(id);

    return NextResponse.json({
      success: true,
      message: "Blog category deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
