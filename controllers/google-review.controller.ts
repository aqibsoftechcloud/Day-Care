import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createGoogleReviewSchema,
  googleReviewIdParamSchema,
  listGoogleReviewsQuerySchema,
  updateGoogleReviewSchema,
} from "@/validators/google-review.validator";
import {
  createGoogleReview,
  deleteGoogleReview,
  getGoogleReviewById,
  getGoogleReviews,
  GoogleReviewNotFoundError,
  updateGoogleReview,
} from "@/services/google-review.service";

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

  if (error instanceof GoogleReviewNotFoundError) {
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
        message: "A conflicting Google review record already exists",
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

export async function listGoogleReviewsHandler(request: NextRequest) {
  try {
    await requirePermission("google-reviews", "view");
    const params = request.nextUrl.searchParams;
    const query = listGoogleReviewsQuerySchema.parse({
      google_location: params.get("google_location") ?? undefined,
      status: params.get("status") ?? undefined,
    });

    const googleReviews = await getGoogleReviews(query);

    return NextResponse.json({ success: true, googleReviews });
  } catch (error) {
    return handleError(error);
  }
}

export async function createGoogleReviewHandler(request: NextRequest) {
  try {
    await requirePermission("google-reviews", "create");
    const body = await request.json();
    const data = createGoogleReviewSchema.parse(body);
    const googleReview = await createGoogleReview(data);

    return NextResponse.json(
      { success: true, googleReview },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function getGoogleReviewHandler(params: { id: string }) {
  try {
    await requirePermission("google-reviews", "view");
    const { id } = googleReviewIdParamSchema.parse(params);
    const googleReview = await getGoogleReviewById(id);

    return NextResponse.json({ success: true, googleReview });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateGoogleReviewHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("google-reviews", "update");
    const { id } = googleReviewIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateGoogleReviewSchema.parse(body);
    const googleReview = await updateGoogleReview(id, data);

    return NextResponse.json({ success: true, googleReview });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteGoogleReviewHandler(params: { id: string }) {
  try {
    await requirePermission("google-reviews", "delete");
    const { id } = googleReviewIdParamSchema.parse(params);
    await deleteGoogleReview(id);

    return NextResponse.json({
      success: true,
      message: "Google review deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
