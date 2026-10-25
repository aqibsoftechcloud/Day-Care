import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createLanguageSchema,
  languageIdParamSchema,
  updateLanguageSchema,
} from "@/validators/language.validator";
import {
  createLanguage,
  deleteLanguage,
  getLanguageById,
  getLanguages,
  LanguageNotFoundError,
  updateLanguage,
} from "@/services/language.service";

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

  if (error instanceof LanguageNotFoundError) {
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
        message: "A language with this SEO URL already exists",
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

export async function listLanguages() {
  try {
    await requirePermission("languages", "view");
    const languages = await getLanguages();
    return NextResponse.json({ success: true, languages });
  } catch (error) {
    return handleError(error);
  }
}

export async function createLanguageHandler(request: NextRequest) {
  try {
    await requirePermission("languages", "create");
    const body = await request.json();
    const data = createLanguageSchema.parse(body);
    const language = await createLanguage(data);

    return NextResponse.json({ success: true, language }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getLanguageHandler(params: { id: string }) {
  try {
    await requirePermission("languages", "view");
    const { id } = languageIdParamSchema.parse(params);
    const language = await getLanguageById(id);

    return NextResponse.json({ success: true, language });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateLanguageHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("languages", "update");
    const { id } = languageIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateLanguageSchema.parse(body);
    const language = await updateLanguage(id, data);

    return NextResponse.json({ success: true, language });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteLanguageHandler(params: { id: string }) {
  try {
    await requirePermission("languages", "delete");
    const { id } = languageIdParamSchema.parse(params);
    await deleteLanguage(id);

    return NextResponse.json({
      success: true,
      message: "Language deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
