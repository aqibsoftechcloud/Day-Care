import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  blogFaqIdParamSchema,
  createBlogFaqSchema,
  listBlogFaqsQuerySchema,
  updateBlogFaqSchema,
} from "@/validators/blog-faq.validator";
import {
  BlogFaqNotFoundError,
  BlogNotFoundError,
  createBlogFaq,
  deleteBlogFaq,
  getBlogFaqById,
  getBlogFaqs,
  updateBlogFaq,
} from "@/services/blog-faq.service";

/**
 * Gated by the "blogs" permission (view/create/update/delete), not
 * "blog-faqs" — the "blog-faqs" module row exists in `modules` but no
 * permission rows were ever seeded for it and no role has ever been
 * granted it (confirmed by inspecting `permissions`/`role_permissions`),
 * so it never actually worked for anyone. Now that FAQ editing lives
 * inside the Blog Add/Edit form rather than its own standalone admin
 * page, "blogs" is the permission that already gates that form, so
 * reusing it here is what actually makes this functional without a
 * separate permissions-table change.
 */
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

  if (error instanceof BlogFaqNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof BlogNotFoundError) {
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
        message: "A conflicting blog FAQ record already exists",
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

export async function listBlogFaqsHandler(request: NextRequest) {
  try {
    await requirePermission("blogs", "view");
    const query = listBlogFaqsQuerySchema.parse({
      blog_id: request.nextUrl.searchParams.get("blog_id") ?? undefined,
    });

    const blogFaqs = await getBlogFaqs(query);

    return NextResponse.json({ success: true, blogFaqs });
  } catch (error) {
    return handleError(error);
  }
}

export async function createBlogFaqHandler(request: NextRequest) {
  try {
    await requirePermission("blogs", "create");
    const body = await request.json();
    const data = createBlogFaqSchema.parse(body);
    const blogFaq = await createBlogFaq(data);

    return NextResponse.json({ success: true, blogFaq }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getBlogFaqHandler(params: { id: string }) {
  try {
    await requirePermission("blogs", "view");
    const { id } = blogFaqIdParamSchema.parse(params);
    const blogFaq = await getBlogFaqById(id);

    return NextResponse.json({ success: true, blogFaq });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateBlogFaqHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("blogs", "update");
    const { id } = blogFaqIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateBlogFaqSchema.parse(body);
    const blogFaq = await updateBlogFaq(id, data);

    return NextResponse.json({ success: true, blogFaq });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteBlogFaqHandler(params: { id: string }) {
  try {
    await requirePermission("blogs", "delete");
    const { id } = blogFaqIdParamSchema.parse(params);
    await deleteBlogFaq(id);

    return NextResponse.json({
      success: true,
      message: "Blog FAQ deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
