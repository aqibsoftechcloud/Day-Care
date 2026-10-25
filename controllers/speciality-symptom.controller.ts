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
  createSpecialitySymptomSchema,
  listSpecialitySymptomsQuerySchema,
  specialitySymptomIdParamSchema,
  updateSpecialitySymptomSchema,
} from "@/validators/speciality-symptom.validator";
import {
  createSpecialitySymptom,
  deleteSpecialitySymptom,
  getSpecialitySymptomById,
  getSpecialitySymptoms,
  SpecialitySymptomImageInput,
  SpecialitySymptomNotFoundError,
  SpecialityNotFoundError,
  updateSpecialitySymptom,
} from "@/services/speciality-symptom.service";

const SPECIALITY_SYMPTOM_UPLOAD_FIELDS = [{ name: "image", maxCount: 1 }];

function toImageInput(
  files: Record<string, Express.Multer.File[]>
): SpecialitySymptomImageInput | undefined {
  const file = files.image?.[0];

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

  if (error instanceof UnsupportedFileTypeError) {
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

  if (error instanceof SpecialitySymptomNotFoundError) {
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
        message: "A conflicting speciality symptom record already exists",
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

export async function listSpecialitySymptomsHandler(request: NextRequest) {
  try {
    await requirePermission("specialities", "view");
    const params = request.nextUrl.searchParams;
    const query = listSpecialitySymptomsQuerySchema.parse({
      speciality_id: params.get("speciality_id") ?? undefined,
      status: params.get("status") ?? undefined,
    });

    const specialitySymptoms = await getSpecialitySymptoms(query);

    return NextResponse.json({ success: true, specialitySymptoms });
  } catch (error) {
    return handleError(error);
  }
}

export async function createSpecialitySymptomHandler(request: NextRequest) {
  try {
    await requirePermission("specialities", "create");
    const { fields, files } = await parseMultipartFields(
      request,
      SPECIALITY_SYMPTOM_UPLOAD_FIELDS
    );
    const data = createSpecialitySymptomSchema.parse(fields);
    const image = toImageInput(files);

    const specialitySymptom = await createSpecialitySymptom(data, image);

    return NextResponse.json(
      { success: true, specialitySymptom },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function getSpecialitySymptomHandler(params: { id: string }) {
  try {
    await requirePermission("specialities", "view");
    const { id } = specialitySymptomIdParamSchema.parse(params);
    const specialitySymptom = await getSpecialitySymptomById(id);

    return NextResponse.json({ success: true, specialitySymptom });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateSpecialitySymptomHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("specialities", "update");
    const { id } = specialitySymptomIdParamSchema.parse(params);
    const { fields, files } = await parseMultipartFields(
      request,
      SPECIALITY_SYMPTOM_UPLOAD_FIELDS
    );
    const data = updateSpecialitySymptomSchema.parse(fields);
    const image = toImageInput(files);

    if (Object.keys(data).length === 0 && !image) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one field or a new image must be provided",
        },
        { status: 400 }
      );
    }

    const specialitySymptom = await updateSpecialitySymptom(id, data, image);

    return NextResponse.json({ success: true, specialitySymptom });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteSpecialitySymptomHandler(params: {
  id: string;
}) {
  try {
    await requirePermission("specialities", "delete");
    const { id } = specialitySymptomIdParamSchema.parse(params);
    await deleteSpecialitySymptom(id);

    return NextResponse.json({
      success: true,
      message: "Speciality symptom deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
