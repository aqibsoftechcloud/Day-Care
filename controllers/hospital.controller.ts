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
  createHospitalSchema,
  hospitalIdParamSchema,
  listHospitalsQuerySchema,
  updateHospitalSchema,
} from "@/validators/hospital.validator";
import {
  CityNotFoundError,
  createHospital,
  deleteHospital,
  getHospitalById,
  getHospitals,
  HospitalImageInput,
  HospitalNotFoundError,
  LocationCityMismatchError,
  LocationNotFoundError,
  updateHospital,
} from "@/services/hospital.service";

const HOSPITAL_UPLOAD_FIELDS = [{ name: "hospital_image_file", maxCount: 1 }];

function toImageInput(files: Record<string, Express.Multer.File[]>): HospitalImageInput | undefined {
  const file = files.hospital_image_file?.[0];

  if (!file) {
    return undefined;
  }

  return { buffer: file.buffer, mimeType: file.mimetype };
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

  if (error instanceof LocationCityMismatchError || error instanceof UnsupportedFileTypeError) {
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

  if (error instanceof HospitalNotFoundError) {
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

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "A hospital with this SEO URL already exists",
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

export async function listHospitals(request: NextRequest) {
  try {
    await requirePermission("hospitals", "view");
    const params = request.nextUrl.searchParams;
    const query = listHospitalsQuerySchema.parse({
      city_id: params.get("city_id") ?? undefined,
      status: params.get("status") ?? undefined,
    });
    const hospitals = await getHospitals(query);
    return NextResponse.json({ success: true, hospitals });
  } catch (error) {
    return handleError(error);
  }
}

export async function createHospitalHandler(request: NextRequest) {
  try {
    await requirePermission("hospitals", "create");
    const { fields, files } = await parseMultipartFields(request, HOSPITAL_UPLOAD_FIELDS);
    const data = createHospitalSchema.parse(fields);
    const image = toImageInput(files);
    const hospital = await createHospital(data, image);

    return NextResponse.json({ success: true, hospital }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getHospitalHandler(params: { id: string }) {
  try {
    await requirePermission("hospitals", "view");
    const { id } = hospitalIdParamSchema.parse(params);
    const hospital = await getHospitalById(id);

    return NextResponse.json({ success: true, hospital });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateHospitalHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("hospitals", "update");
    const { id } = hospitalIdParamSchema.parse(params);
    const { fields, files } = await parseMultipartFields(request, HOSPITAL_UPLOAD_FIELDS);
    const data = updateHospitalSchema.parse(fields);
    const image = toImageInput(files);
    const hospital = await updateHospital(id, data, image);

    return NextResponse.json({ success: true, hospital });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteHospitalHandler(params: { id: string }) {
  try {
    await requirePermission("hospitals", "delete");
    const { id } = hospitalIdParamSchema.parse(params);
    await deleteHospital(id);

    return NextResponse.json({
      success: true,
      message: "Hospital deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
