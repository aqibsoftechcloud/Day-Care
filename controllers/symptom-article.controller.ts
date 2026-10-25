import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createSymptomArticleSchema,
  listSymptomArticlesQuerySchema,
  symptomArticleIdParamSchema,
  updateSymptomArticleSchema,
} from "@/validators/symptom-article.validator";
import {
  createSymptomArticle,
  deleteSymptomArticle,
  getSymptomArticleById,
  getSymptomArticles,
  SymptomArticleNotFoundError,
  SymptomNotFoundError,
  SymptomPartNotFoundError,
  updateSymptomArticle,
} from "@/services/symptom-article.service";

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
    error instanceof SymptomArticleNotFoundError ||
    error instanceof SymptomPartNotFoundError ||
    error instanceof SymptomNotFoundError
  ) {
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
        message: "A symptom article with this SEO URL already exists",
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

export async function listSymptomArticlesHandler(request: NextRequest) {
  try {
    await requirePermission("articles", "view");
    const params = request.nextUrl.searchParams;
    const query = listSymptomArticlesQuerySchema.parse({
      part_id: params.get("part_id") ?? undefined,
      symptom_id: params.get("symptom_id") ?? undefined,
      status: params.get("status") ?? undefined,
    });

    const symptomArticles = await getSymptomArticles(query);

    return NextResponse.json({ success: true, symptomArticles });
  } catch (error) {
    return handleError(error);
  }
}

export async function createSymptomArticleHandler(request: NextRequest) {
  try {
    await requirePermission("articles", "create");
    const body = await request.json();
    const data = createSymptomArticleSchema.parse(body);
    const symptomArticle = await createSymptomArticle(data);

    return NextResponse.json(
      { success: true, symptomArticle },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function getSymptomArticleHandler(params: { id: string }) {
  try {
    await requirePermission("articles", "view");
    const { id } = symptomArticleIdParamSchema.parse(params);
    const symptomArticle = await getSymptomArticleById(id);

    return NextResponse.json({ success: true, symptomArticle });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateSymptomArticleHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("articles", "update");
    const { id } = symptomArticleIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateSymptomArticleSchema.parse(body);
    const symptomArticle = await updateSymptomArticle(id, data);

    return NextResponse.json({ success: true, symptomArticle });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteSymptomArticleHandler(params: { id: string }) {
  try {
    await requirePermission("articles", "delete");
    const { id } = symptomArticleIdParamSchema.parse(params);
    await deleteSymptomArticle(id);

    return NextResponse.json({
      success: true,
      message: "Symptom article deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
