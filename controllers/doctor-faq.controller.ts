import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createDoctorFaqSchema,
  doctorFaqIdParamSchema,
  listDoctorFaqsQuerySchema,
  updateDoctorFaqSchema,
} from "@/validators/doctor-faq.validator";
import {
  createDoctorFaq,
  deleteDoctorFaq,
  DoctorFaqNotFoundError,
  DoctorNotFoundError,
  getDoctorFaqById,
  getDoctorFaqs,
  updateDoctorFaq,
} from "@/services/doctor-faq.service";

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

  if (error instanceof DoctorFaqNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof DoctorNotFoundError) {
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
        message: "A conflicting doctor FAQ record already exists",
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

export async function listDoctorFaqsHandler(request: NextRequest) {
  try {
    await requirePermission("doctors", "view");
    const query = listDoctorFaqsQuerySchema.parse({
      doctor_id: request.nextUrl.searchParams.get("doctor_id") ?? undefined,
    });

    const doctorFaqs = await getDoctorFaqs(query);

    return NextResponse.json({ success: true, doctorFaqs });
  } catch (error) {
    return handleError(error);
  }
}

export async function createDoctorFaqHandler(request: NextRequest) {
  try {
    await requirePermission("doctors", "create");
    const body = await request.json();
    const data = createDoctorFaqSchema.parse(body);
    const doctorFaq = await createDoctorFaq(data);

    return NextResponse.json({ success: true, doctorFaq }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getDoctorFaqHandler(params: { id: string }) {
  try {
    await requirePermission("doctors", "view");
    const { id } = doctorFaqIdParamSchema.parse(params);
    const doctorFaq = await getDoctorFaqById(id);

    return NextResponse.json({ success: true, doctorFaq });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateDoctorFaqHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("doctors", "update");
    const { id } = doctorFaqIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateDoctorFaqSchema.parse(body);
    const doctorFaq = await updateDoctorFaq(id, data);

    return NextResponse.json({ success: true, doctorFaq });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteDoctorFaqHandler(params: { id: string }) {
  try {
    await requirePermission("doctors", "delete");
    const { id } = doctorFaqIdParamSchema.parse(params);
    await deleteDoctorFaq(id);

    return NextResponse.json({
      success: true,
      message: "Doctor FAQ deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
