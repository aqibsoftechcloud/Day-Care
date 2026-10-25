import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createDoctorSpecialitySchema,
  doctorSpecialityIdParamSchema,
  listDoctorSpecialitiesQuerySchema,
  updateDoctorSpecialitySchema,
} from "@/validators/doctor-speciality.validator";
import {
  createDoctorSpeciality,
  deleteDoctorSpeciality,
  DoctorSpecialityNotFoundError,
  getDoctorSpecialities,
  getDoctorSpecialityById,
  LanguageNotFoundError,
  updateDoctorSpeciality,
} from "@/services/doctor-speciality.service";

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

  if (error instanceof DoctorSpecialityNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
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
        message: "A doctor speciality with this SEO URL already exists",
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

export async function listDoctorSpecialitiesHandler(request: NextRequest) {
  try {
    await requirePermission("doctor-specialities", "view");
    const params = request.nextUrl.searchParams;
    const query = listDoctorSpecialitiesQuerySchema.parse({
      language_id: params.get("language_id") ?? undefined,
      status: params.get("status") ?? undefined,
    });

    const doctorSpecialities = await getDoctorSpecialities(query);

    return NextResponse.json({ success: true, doctorSpecialities });
  } catch (error) {
    return handleError(error);
  }
}

export async function createDoctorSpecialityHandler(request: NextRequest) {
  try {
    await requirePermission("doctor-specialities", "create");
    const body = await request.json();
    const data = createDoctorSpecialitySchema.parse(body);
    const doctorSpeciality = await createDoctorSpeciality(data);

    return NextResponse.json(
      { success: true, doctorSpeciality },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function getDoctorSpecialityHandler(params: { id: string }) {
  try {
    await requirePermission("doctor-specialities", "view");
    const { id } = doctorSpecialityIdParamSchema.parse(params);
    const doctorSpeciality = await getDoctorSpecialityById(id);

    return NextResponse.json({ success: true, doctorSpeciality });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateDoctorSpecialityHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("doctor-specialities", "update");
    const { id } = doctorSpecialityIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateDoctorSpecialitySchema.parse(body);
    const doctorSpeciality = await updateDoctorSpeciality(id, data);

    return NextResponse.json({ success: true, doctorSpeciality });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteDoctorSpecialityHandler(params: {
  id: string;
}) {
  try {
    await requirePermission("doctor-specialities", "delete");
    const { id } = doctorSpecialityIdParamSchema.parse(params);
    await deleteDoctorSpeciality(id);

    return NextResponse.json({
      success: true,
      message: "Doctor speciality deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
