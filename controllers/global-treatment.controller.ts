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
  createGlobalTreatmentSchema,
  globalTreatmentIdParamSchema,
  listGlobalTreatmentsQuerySchema,
  updateGlobalTreatmentSchema,
} from "@/validators/global-treatment.validator";
import {
  createGlobalTreatment,
  deleteGlobalTreatment,
  getGlobalTreatmentById,
  getGlobalTreatments,
  GlobalSeoUrlCollisionError,
  GlobalSpecialityNotFoundError,
  GlobalTreatmentImageInput,
  GlobalTreatmentNotFoundError,
  updateGlobalTreatment,
} from "@/services/global-treatment.service";

const GLOBAL_TREATMENT_UPLOAD_FIELDS = [
  { name: "image", maxCount: 1 },
  { name: "card_icon", maxCount: 1 },
];

function toImageInput(
  files: Record<string, Express.Multer.File[]>,
  fieldName: "image" | "card_icon" = "image"
): GlobalTreatmentImageInput | undefined {
  const file = files[fieldName]?.[0];

  if (!file) {
    return undefined;
  }

  return { buffer: file.buffer, mimeType: file.mimetype };
}

/**
 * Resolves the three possible states for an update's image — mirrors
 * controllers/speciality.controller.ts's resolveImageInput() exactly:
 * - a new file was uploaded -> replace
 * - the "image" text field was sent as an empty string (multipart has no
 *   native null) -> explicit clear (admin clicked "Remove")
 * - neither -> undefined, meaning "leave the existing image untouched"
 */
function resolveImageInput(
  fields: Record<string, string>,
  files: Record<string, Express.Multer.File[]>,
  fieldName: "image" | "card_icon" = "image"
): GlobalTreatmentImageInput | null | undefined {
  const file = toImageInput(files, fieldName);

  if (file) {
    return file;
  }

  if (fields[fieldName] === "") {
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
      { success: false, message: "Validation failed", errors: error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (error instanceof UnsupportedFileTypeError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }

  if (error instanceof MulterError) {
    return NextResponse.json({ success: false, message: `Upload error: ${error.message}` }, { status: 400 });
  }

  if (error instanceof GlobalSeoUrlCollisionError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 409 });
  }

  if (error instanceof GlobalTreatmentNotFoundError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 404 });
  }

  if (error instanceof GlobalSpecialityNotFoundError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 404 });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json(
      { success: false, message: "A global treatment with this SEO URL already exists" },
      { status: 409 }
    );
  }

  console.error(error);

  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

export async function listGlobalTreatmentsHandler(request: NextRequest) {
  try {
    await requirePermission("global-treatments", "view");
    const params = request.nextUrl.searchParams;
    const query = listGlobalTreatmentsQuerySchema.parse({
      status: params.get("status") ?? undefined,
    });

    const globalTreatments = await getGlobalTreatments(query);

    return NextResponse.json({ success: true, globalTreatments });
  } catch (error) {
    return handleError(error);
  }
}

export async function createGlobalTreatmentHandler(request: NextRequest) {
  try {
    await requirePermission("global-treatments", "create");
    const { fields, files } = await parseMultipartFields(request, GLOBAL_TREATMENT_UPLOAD_FIELDS);
    const data = createGlobalTreatmentSchema.parse(fields);
    const image = toImageInput(files);
    const cardIcon = toImageInput(files, "card_icon");

    const globalTreatment = await createGlobalTreatment(data, image, cardIcon);

    return NextResponse.json({ success: true, globalTreatment }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getGlobalTreatmentHandler(params: { id: string }) {
  try {
    await requirePermission("global-treatments", "view");
    const { id } = globalTreatmentIdParamSchema.parse(params);
    const globalTreatment = await getGlobalTreatmentById(id);

    return NextResponse.json({ success: true, globalTreatment });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateGlobalTreatmentHandler(request: NextRequest, params: { id: string }) {
  try {
    await requirePermission("global-treatments", "update");
    const { id } = globalTreatmentIdParamSchema.parse(params);
    const { fields, files } = await parseMultipartFields(request, GLOBAL_TREATMENT_UPLOAD_FIELDS);
    const data = updateGlobalTreatmentSchema.parse(fields);
    const image = resolveImageInput(fields, files);
    const cardIcon = resolveImageInput(fields, files, "card_icon");

    if (Object.keys(data).length === 0 && image === undefined && cardIcon === undefined) {
      return NextResponse.json(
        { success: false, message: "At least one field or a new image must be provided" },
        { status: 400 }
      );
    }

    const globalTreatment = await updateGlobalTreatment(id, data, image, cardIcon);

    return NextResponse.json({ success: true, globalTreatment });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteGlobalTreatmentHandler(params: { id: string }) {
  try {
    await requirePermission("global-treatments", "delete");
    const { id } = globalTreatmentIdParamSchema.parse(params);
    await deleteGlobalTreatment(id);

    return NextResponse.json({ success: true, message: "Global treatment deactivated" });
  } catch (error) {
    return handleError(error);
  }
}
