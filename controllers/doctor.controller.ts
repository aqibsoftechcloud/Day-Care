import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  MulterError,
  parseMultipartFields,
  UnsupportedFileTypeError,
} from "@/lib/upload";
import {
  createDoctorSchema,
  doctorIdParamSchema,
  listDoctorsQuerySchema,
  updateDoctorSchema,
} from "@/validators/doctor.validator";
import {
  CityNotFoundError,
  createDoctor,
  deleteDoctor,
  DoctorImageInput,
  DoctorNotFoundError,
  getDoctorById,
  getDoctors,
  LanguageNotFoundError,
  LocationCityMismatchError,
  LocationNotFoundError,
  updateDoctor,
} from "@/services/doctor.service";

const DOCTOR_UPLOAD_FIELDS = [{ name: "doctor_image", maxCount: 1 }];

function toImageInput(
  files: Record<string, Express.Multer.File[]>
): DoctorImageInput | undefined {
  const file = files.doctor_image?.[0];

  if (!file) {
    return undefined;
  }

  return { buffer: file.buffer, mimeType: file.mimetype };
}

/**
 * Resolves the three possible states for an update's image:
 * - a new file was uploaded -> replace
 * - the "doctor_image" text field was sent as an empty string
 *   (multipart has no native null) -> explicit clear
 * - neither -> undefined, meaning "leave the existing image untouched"
 */
function resolveImageInput(
  fields: Record<string, string>,
  files: Record<string, Express.Multer.File[]>
): DoctorImageInput | null | undefined {
  const file = toImageInput(files);

  if (file) {
    return file;
  }

  if (fields.doctor_image === "") {
    return null;
  }

  return undefined;
}

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
    error instanceof UnsupportedFileTypeError ||
    error instanceof LocationCityMismatchError
  ) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }

  if (error instanceof MulterError) {
    return NextResponse.json(
      { success: false, message: `Upload error: ${error.message}` },
      { status: 400 }
    );
  }

  if (
    error instanceof DoctorNotFoundError ||
    error instanceof LanguageNotFoundError ||
    error instanceof CityNotFoundError ||
    error instanceof LocationNotFoundError
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
        message: "A doctor with this SEO URL already exists",
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

export async function listDoctorsHandler(request: NextRequest) {
  try {
    await requirePermission("doctors", "view");
    const params = request.nextUrl.searchParams;
    const query = listDoctorsQuerySchema.parse({
      language_id: params.get("language_id") ?? undefined,
      city_id: params.get("city_id") ?? undefined,
      location_id: params.get("location_id") ?? undefined,
      status: params.get("status") ?? undefined,
    });

    const doctors = await getDoctors(query);

    return NextResponse.json({ success: true, doctors });
  } catch (error) {
    return handleError(error);
  }
}

export async function createDoctorHandler(request: NextRequest) {
  try {
    await requirePermission("doctors", "create");
    const { fields, files } = await parseMultipartFields(
      request,
      DOCTOR_UPLOAD_FIELDS
    );
    const data = createDoctorSchema.parse(fields);
    const image = toImageInput(files);

    const doctor = await createDoctor(data, image);

    return NextResponse.json({ success: true, doctor }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getDoctorHandler(params: { id: string }) {
  try {
    await requirePermission("doctors", "view");
    const { id } = doctorIdParamSchema.parse(params);
    const doctor = await getDoctorById(id);

    return NextResponse.json({ success: true, doctor });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateDoctorHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("doctors", "update");
    const { id } = doctorIdParamSchema.parse(params);
    const { fields, files } = await parseMultipartFields(
      request,
      DOCTOR_UPLOAD_FIELDS
    );
    const data = updateDoctorSchema.parse(fields);
    const image = resolveImageInput(fields, files);

    if (Object.keys(data).length === 0 && image === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one field or an image change must be provided",
        },
        { status: 400 }
      );
    }

    const doctor = await updateDoctor(id, data, image);

    return NextResponse.json({ success: true, doctor });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteDoctorHandler(params: { id: string }) {
  try {
    await requirePermission("doctors", "delete");
    const { id } = doctorIdParamSchema.parse(params);
    await deleteDoctor(id);

    return NextResponse.json({
      success: true,
      message: "Doctor deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
