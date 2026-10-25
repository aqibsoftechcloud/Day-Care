import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createSpecialityFaqSchema,
  listSpecialityFaqsQuerySchema,
  specialityFaqIdParamSchema,
  updateSpecialityFaqSchema,
} from "@/validators/speciality-faq.validator";
import {
  createSpecialityFaq,
  deleteSpecialityFaq,
  getSpecialityFaqById,
  getSpecialityFaqs,
  SpecialityFaqNotFoundError,
  SpecialityNotFoundError,
  updateSpecialityFaq,
} from "@/services/speciality-faq.service";

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

  if (error instanceof SpecialityFaqNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof SpecialityNotFoundError) {
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
        message: "A conflicting speciality FAQ record already exists",
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

export async function listSpecialityFaqsHandler(request: NextRequest) {
  try {
    await requirePermission("specialities", "view");
    const query = listSpecialityFaqsQuerySchema.parse({
      speciality_id:
        request.nextUrl.searchParams.get("speciality_id") ?? undefined,
    });

    const specialityFaqs = await getSpecialityFaqs(query);

    return NextResponse.json({ success: true, specialityFaqs });
  } catch (error) {
    return handleError(error);
  }
}

export async function createSpecialityFaqHandler(request: NextRequest) {
  try {
    await requirePermission("specialities", "create");
    const body = await request.json();
    const data = createSpecialityFaqSchema.parse(body);
    const specialityFaq = await createSpecialityFaq(data);

    return NextResponse.json(
      { success: true, specialityFaq },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function getSpecialityFaqHandler(params: { id: string }) {
  try {
    await requirePermission("specialities", "view");
    const { id } = specialityFaqIdParamSchema.parse(params);
    const specialityFaq = await getSpecialityFaqById(id);

    return NextResponse.json({ success: true, specialityFaq });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateSpecialityFaqHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("specialities", "update");
    const { id } = specialityFaqIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateSpecialityFaqSchema.parse(body);
    const specialityFaq = await updateSpecialityFaq(id, data);

    return NextResponse.json({ success: true, specialityFaq });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteSpecialityFaqHandler(params: { id: string }) {
  try {
    await requirePermission("specialities", "delete");
    const { id } = specialityFaqIdParamSchema.parse(params);
    await deleteSpecialityFaq(id);

    return NextResponse.json({
      success: true,
      message: "Speciality FAQ deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
