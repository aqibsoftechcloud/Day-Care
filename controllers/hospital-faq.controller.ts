import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createHospitalFaqSchema,
  hospitalFaqIdParamSchema,
  listHospitalFaqsQuerySchema,
  updateHospitalFaqSchema,
} from "@/validators/hospital-faq.validator";
import {
  createHospitalFaq,
  deleteHospitalFaq,
  getHospitalFaqById,
  getHospitalFaqs,
  HospitalFaqNotFoundError,
  HospitalNotFoundError,
  updateHospitalFaq,
} from "@/services/hospital-faq.service";

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

  if (error instanceof HospitalFaqNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof HospitalNotFoundError) {
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
        message: "A conflicting hospital FAQ record already exists",
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

export async function listHospitalFaqsHandler(request: NextRequest) {
  try {
    await requirePermission("hospitals", "view");
    const query = listHospitalFaqsQuerySchema.parse({
      hospital_id: request.nextUrl.searchParams.get("hospital_id") ?? undefined,
    });

    const hospitalFaqs = await getHospitalFaqs(query);

    return NextResponse.json({ success: true, hospitalFaqs });
  } catch (error) {
    return handleError(error);
  }
}

export async function createHospitalFaqHandler(request: NextRequest) {
  try {
    await requirePermission("hospitals", "create");
    const body = await request.json();
    const data = createHospitalFaqSchema.parse(body);
    const hospitalFaq = await createHospitalFaq(data);

    return NextResponse.json({ success: true, hospitalFaq }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getHospitalFaqHandler(params: { id: string }) {
  try {
    await requirePermission("hospitals", "view");
    const { id } = hospitalFaqIdParamSchema.parse(params);
    const hospitalFaq = await getHospitalFaqById(id);

    return NextResponse.json({ success: true, hospitalFaq });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateHospitalFaqHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("hospitals", "update");
    const { id } = hospitalFaqIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateHospitalFaqSchema.parse(body);
    const hospitalFaq = await updateHospitalFaq(id, data);

    return NextResponse.json({ success: true, hospitalFaq });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteHospitalFaqHandler(params: { id: string }) {
  try {
    await requirePermission("hospitals", "delete");
    const { id } = hospitalFaqIdParamSchema.parse(params);
    await deleteHospitalFaq(id);

    return NextResponse.json({
      success: true,
      message: "Hospital FAQ deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
