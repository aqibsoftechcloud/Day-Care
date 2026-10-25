import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createDoctorAwardSchema,
  doctorAwardIdParamSchema,
  listDoctorAwardsQuerySchema,
  updateDoctorAwardSchema,
} from "@/validators/doctor-award.validator";
import {
  createDoctorAward,
  deleteDoctorAward,
  DoctorAwardNotFoundError,
  DoctorNotFoundError,
  getDoctorAwardById,
  getDoctorAwards,
  updateDoctorAward,
} from "@/services/doctor-award.service";

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

  if (error instanceof DoctorAwardNotFoundError) {
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
        message: "A conflicting doctor award record already exists",
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

export async function listDoctorAwardsHandler(request: NextRequest) {
  try {
    await requirePermission("doctors", "view");
    const query = listDoctorAwardsQuerySchema.parse({
      doctor_id: request.nextUrl.searchParams.get("doctor_id") ?? undefined,
    });

    const doctorAwards = await getDoctorAwards(query);

    return NextResponse.json({ success: true, doctorAwards });
  } catch (error) {
    return handleError(error);
  }
}

export async function createDoctorAwardHandler(request: NextRequest) {
  try {
    await requirePermission("doctors", "create");
    const body = await request.json();
    const data = createDoctorAwardSchema.parse(body);
    const doctorAward = await createDoctorAward(data);

    return NextResponse.json({ success: true, doctorAward }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getDoctorAwardHandler(params: { id: string }) {
  try {
    await requirePermission("doctors", "view");
    const { id } = doctorAwardIdParamSchema.parse(params);
    const doctorAward = await getDoctorAwardById(id);

    return NextResponse.json({ success: true, doctorAward });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateDoctorAwardHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("doctors", "update");
    const { id } = doctorAwardIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateDoctorAwardSchema.parse(body);
    const doctorAward = await updateDoctorAward(id, data);

    return NextResponse.json({ success: true, doctorAward });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteDoctorAwardHandler(params: { id: string }) {
  try {
    await requirePermission("doctors", "delete");
    const { id } = doctorAwardIdParamSchema.parse(params);
    await deleteDoctorAward(id);

    return NextResponse.json({
      success: true,
      message: "Doctor award deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
