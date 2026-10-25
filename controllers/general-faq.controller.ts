import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createGeneralFaqSchema,
  generalFaqIdParamSchema,
  listGeneralFaqsQuerySchema,
  updateGeneralFaqSchema,
} from "@/validators/general-faq.validator";
import {
  createGeneralFaq,
  deleteGeneralFaq,
  GeneralFaqNotFoundError,
  getGeneralFaqById,
  getGeneralFaqs,
  updateGeneralFaq,
} from "@/services/general-faq.service";

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

  if (error instanceof GeneralFaqNotFoundError) {
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
        message: "A conflicting general FAQ record already exists",
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

export async function listGeneralFaqsHandler(request: NextRequest) {
  try {
    await requirePermission("general-faqs", "view");
    const query = listGeneralFaqsQuerySchema.parse({
      status: request.nextUrl.searchParams.get("status") ?? undefined,
    });

    const generalFaqs = await getGeneralFaqs(query);

    return NextResponse.json({ success: true, generalFaqs });
  } catch (error) {
    return handleError(error);
  }
}

export async function createGeneralFaqHandler(request: NextRequest) {
  try {
    await requirePermission("general-faqs", "create");
    const body = await request.json();
    const data = createGeneralFaqSchema.parse(body);
    const generalFaq = await createGeneralFaq(data);

    return NextResponse.json({ success: true, generalFaq }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getGeneralFaqHandler(params: { id: string }) {
  try {
    await requirePermission("general-faqs", "view");
    const { id } = generalFaqIdParamSchema.parse(params);
    const generalFaq = await getGeneralFaqById(id);

    return NextResponse.json({ success: true, generalFaq });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateGeneralFaqHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("general-faqs", "update");
    const { id } = generalFaqIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateGeneralFaqSchema.parse(body);
    const generalFaq = await updateGeneralFaq(id, data);

    return NextResponse.json({ success: true, generalFaq });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteGeneralFaqHandler(params: { id: string }) {
  try {
    await requirePermission("general-faqs", "delete");
    const { id } = generalFaqIdParamSchema.parse(params);
    await deleteGeneralFaq(id);

    return NextResponse.json({
      success: true,
      message: "General FAQ deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
