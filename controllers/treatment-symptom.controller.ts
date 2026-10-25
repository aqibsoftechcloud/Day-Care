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
  createTreatmentSymptomSchema,
  listTreatmentSymptomsQuerySchema,
  treatmentSymptomIdParamSchema,
  updateTreatmentSymptomSchema,
} from "@/validators/treatment-symptom.validator";
import {
  createTreatmentSymptom,
  deleteTreatmentSymptom,
  getTreatmentSymptomById,
  getTreatmentSymptoms,
  TreatmentNotFoundError,
  TreatmentSymptomImageInput,
  TreatmentSymptomNotFoundError,
  updateTreatmentSymptom,
} from "@/services/treatment-symptom.service";

const TREATMENT_SYMPTOM_UPLOAD_FIELDS = [{ name: "image", maxCount: 1 }];

function toImageInput(
  files: Record<string, Express.Multer.File[]>
): TreatmentSymptomImageInput | undefined {
  const file = files.image?.[0];

  if (!file) {
    return undefined;
  }

  return { buffer: file.buffer, mimeType: file.mimetype };
}

/**
 * Resolves the three possible states for an update's image:
 * - a new file was uploaded -> replace
 * - the "image" text field was sent as an empty string (multipart has no
 *   native null) -> explicit clear
 * - neither -> undefined, meaning "leave the existing image untouched"
 */
function resolveImageInput(
  fields: Record<string, string>,
  files: Record<string, Express.Multer.File[]>
): TreatmentSymptomImageInput | null | undefined {
  const file = toImageInput(files);

  if (file) {
    return file;
  }

  if (fields.image === "") {
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

  if (error instanceof TreatmentSymptomNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof TreatmentNotFoundError) {
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
        message: "A conflicting treatment symptom record already exists",
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

export async function listTreatmentSymptomsHandler(request: NextRequest) {
  try {
    await requirePermission("treatments", "view");
    const params = request.nextUrl.searchParams;
    const query = listTreatmentSymptomsQuerySchema.parse({
      treatment_id: params.get("treatment_id") ?? undefined,
      status: params.get("status") ?? undefined,
    });

    const treatmentSymptoms = await getTreatmentSymptoms(query);

    return NextResponse.json({ success: true, treatmentSymptoms });
  } catch (error) {
    return handleError(error);
  }
}

export async function createTreatmentSymptomHandler(request: NextRequest) {
  try {
    await requirePermission("treatments", "create");
    const { fields, files } = await parseMultipartFields(
      request,
      TREATMENT_SYMPTOM_UPLOAD_FIELDS
    );
    const data = createTreatmentSymptomSchema.parse(fields);
    const image = toImageInput(files);

    const treatmentSymptom = await createTreatmentSymptom(data, image);

    return NextResponse.json(
      { success: true, treatmentSymptom },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function getTreatmentSymptomHandler(params: { id: string }) {
  try {
    await requirePermission("treatments", "view");
    const { id } = treatmentSymptomIdParamSchema.parse(params);
    const treatmentSymptom = await getTreatmentSymptomById(id);

    return NextResponse.json({ success: true, treatmentSymptom });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateTreatmentSymptomHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("treatments", "update");
    const { id } = treatmentSymptomIdParamSchema.parse(params);
    const { fields, files } = await parseMultipartFields(
      request,
      TREATMENT_SYMPTOM_UPLOAD_FIELDS
    );
    const data = updateTreatmentSymptomSchema.parse(fields);
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

    const treatmentSymptom = await updateTreatmentSymptom(id, data, image);

    return NextResponse.json({ success: true, treatmentSymptom });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteTreatmentSymptomHandler(params: {
  id: string;
}) {
  try {
    await requirePermission("treatments", "delete");
    const { id } = treatmentSymptomIdParamSchema.parse(params);
    await deleteTreatmentSymptom(id);

    return NextResponse.json({
      success: true,
      message: "Treatment symptom deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
