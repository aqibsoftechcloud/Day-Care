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
  createTreatmentSchema,
  listTreatmentsQuerySchema,
  treatmentIdParamSchema,
  updateTreatmentSchema,
} from "@/validators/treatment.validator";
import {
  CityNotFoundError,
  createTreatment,
  deleteTreatment,
  GlobalTreatmentNotFoundError,
  getTreatmentById,
  getTreatments,
  HospitalNotFoundError,
  LanguageNotFoundError,
  LocationCityMismatchError,
  LocationNotFoundError,
  SpecialityNotFoundError,
  TreatmentImageInput,
  TreatmentNotFoundError,
  updateTreatment,
} from "@/services/treatment.service";

const TREATMENT_UPLOAD_FIELDS = [
  { name: "speciality_logo", maxCount: 1 },
  { name: "card_icon", maxCount: 1 },
];

function toImageInput(
  files: Record<string, Express.Multer.File[]>,
  fieldName: "speciality_logo" | "card_icon" = "speciality_logo"
): TreatmentImageInput | undefined {
  const file = files[fieldName]?.[0];

  if (!file) {
    return undefined;
  }

  return { buffer: file.buffer, mimeType: file.mimetype };
}

/** Card icon update states: new file -> replace; `card_icon` text field sent as "" -> explicit clear (null); neither -> undefined (leave untouched). */
function resolveCardIconInput(
  fields: Record<string, string>,
  files: Record<string, Express.Multer.File[]>
): TreatmentImageInput | null | undefined {
  const file = toImageInput(files, "card_icon");

  if (file) {
    return file;
  }

  return fields.card_icon === "" ? null : undefined;
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
    error instanceof TreatmentNotFoundError ||
    error instanceof SpecialityNotFoundError ||
    error instanceof LanguageNotFoundError ||
    error instanceof CityNotFoundError ||
    error instanceof LocationNotFoundError ||
    error instanceof HospitalNotFoundError ||
    error instanceof GlobalTreatmentNotFoundError
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
        message: "A treatment with this SEO URL already exists",
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

export async function listTreatmentsHandler(request: NextRequest) {
  try {
    await requirePermission("treatments", "view");
    const params = request.nextUrl.searchParams;
    const query = listTreatmentsQuerySchema.parse({
      speciality_id: params.get("speciality_id") ?? undefined,
      language_id: params.get("language_id") ?? undefined,
      city_id: params.get("city_id") ?? undefined,
      location_id: params.get("location_id") ?? undefined,
      hospital_id: params.get("hospital_id") ?? undefined,
      global_treatment_id: params.get("global_treatment_id") ?? undefined,
      status: params.get("status") ?? undefined,
    });

    const treatments = await getTreatments(query);

    return NextResponse.json({ success: true, treatments });
  } catch (error) {
    return handleError(error);
  }
}

export async function createTreatmentHandler(request: NextRequest) {
  try {
    await requirePermission("treatments", "create");
    const { fields, files } = await parseMultipartFields(
      request,
      TREATMENT_UPLOAD_FIELDS
    );
    const data = createTreatmentSchema.parse(fields);
    const image = toImageInput(files);
    const cardIcon = toImageInput(files, "card_icon");

    const treatment = await createTreatment(data, image, cardIcon);

    return NextResponse.json({ success: true, treatment }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getTreatmentHandler(params: { id: string }) {
  try {
    await requirePermission("treatments", "view");
    const { id } = treatmentIdParamSchema.parse(params);
    const treatment = await getTreatmentById(id);

    return NextResponse.json({ success: true, treatment });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateTreatmentHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("treatments", "update");
    const { id } = treatmentIdParamSchema.parse(params);
    const { fields, files } = await parseMultipartFields(
      request,
      TREATMENT_UPLOAD_FIELDS
    );
    const data = updateTreatmentSchema.parse(fields);
    const image = toImageInput(files);
    const cardIcon = resolveCardIconInput(fields, files);

    if (Object.keys(data).length === 0 && !image && cardIcon === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one field or a new image must be provided",
        },
        { status: 400 }
      );
    }

    const treatment = await updateTreatment(id, data, image, cardIcon);

    return NextResponse.json({ success: true, treatment });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteTreatmentHandler(params: { id: string }) {
  try {
    await requirePermission("treatments", "delete");
    const { id } = treatmentIdParamSchema.parse(params);
    await deleteTreatment(id);

    return NextResponse.json({
      success: true,
      message: "Treatment deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
