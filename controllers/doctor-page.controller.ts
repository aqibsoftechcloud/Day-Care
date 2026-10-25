import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createDoctorPageSchema,
  doctorPageIdParamSchema,
  updateDoctorPageSchema,
} from "@/validators/doctor-page.validator";
import {
  CityNotFoundError,
  createDoctorPage,
  deleteDoctorPage,
  DoctorPageNotFoundError,
  getDoctorPageById,
  getDoctorPages,
  LocationCityMismatchError,
  LocationNotFoundError,
  SpecialityNotFoundError,
  updateDoctorPage,
} from "@/services/doctor-page.service";

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

  if (error instanceof LocationCityMismatchError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }

  if (error instanceof DoctorPageNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof CityNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof LocationNotFoundError) {
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
        message: "A doctor page with this SEO URL already exists",
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

export async function listDoctorPages() {
  try {
    await requirePermission("doctor-pages", "view");
    const doctorPages = await getDoctorPages();
    return NextResponse.json({ success: true, doctorPages });
  } catch (error) {
    return handleError(error);
  }
}

export async function createDoctorPageHandler(request: NextRequest) {
  try {
    await requirePermission("doctor-pages", "create");
    const body = await request.json();
    const data = createDoctorPageSchema.parse(body);
    const doctorPage = await createDoctorPage(data);

    return NextResponse.json({ success: true, doctorPage }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getDoctorPageHandler(params: { id: string }) {
  try {
    await requirePermission("doctor-pages", "view");
    const { id } = doctorPageIdParamSchema.parse(params);
    const doctorPage = await getDoctorPageById(id);

    return NextResponse.json({ success: true, doctorPage });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateDoctorPageHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("doctor-pages", "update");
    const { id } = doctorPageIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateDoctorPageSchema.parse(body);
    const doctorPage = await updateDoctorPage(id, data);

    return NextResponse.json({ success: true, doctorPage });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteDoctorPageHandler(params: { id: string }) {
  try {
    await requirePermission("doctor-pages", "delete");
    const { id } = doctorPageIdParamSchema.parse(params);
    await deleteDoctorPage(id);

    return NextResponse.json({
      success: true,
      message: "Doctor page deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
