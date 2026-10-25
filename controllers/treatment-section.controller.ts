import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
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
  createTreatmentSectionSchema,
  treatmentIdParamSchema,
  treatmentSectionIdParamSchema,
  reorderTreatmentSectionsSchema,
  updateTreatmentSectionSchema,
} from "@/validators/treatment-section.validator";
import {
  CannotDeleteFixedSectionError,
  createTreatmentSection,
  deleteTreatmentSection,
  getOrCreateTreatmentSections,
  InvalidSectionContentError,
  reorderTreatmentSections,
  TreatmentNotFoundError,
  TreatmentSectionNotFoundError,
  updateTreatmentSection,
  uploadTreatmentSectionImage,
} from "@/services/treatment-section.service";

const SECTION_IMAGE_UPLOAD_FIELDS = [{ name: "image", maxCount: 1 }];

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

  if (error instanceof InvalidSectionContentError || error instanceof CannotDeleteFixedSectionError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }

  if (error instanceof UnsupportedFileTypeError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }

  if (error instanceof MulterError) {
    return NextResponse.json({ success: false, message: `Upload error: ${error.message}` }, { status: 400 });
  }

  if (error instanceof TreatmentNotFoundError || error instanceof TreatmentSectionNotFoundError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 404 });
  }

  console.error(error);

  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

export async function listTreatmentSectionsHandler(params: { id: string }) {
  try {
    await requirePermission("treatments", "view");
    const { id } = treatmentIdParamSchema.parse(params);
    const sections = await getOrCreateTreatmentSections(id);

    return NextResponse.json({ success: true, sections });
  } catch (error) {
    return handleError(error);
  }
}

export async function createTreatmentSectionHandler(request: NextRequest, params: { id: string }) {
  try {
    await requirePermission("treatments", "update");
    const { id } = treatmentIdParamSchema.parse(params);
    const body = await request.json();
    const data = createTreatmentSectionSchema.parse(body);
    const section = await createTreatmentSection(id, data);

    return NextResponse.json({ success: true, section }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateTreatmentSectionHandler(
  request: NextRequest,
  params: { id: string; sectionId: string }
) {
  try {
    await requirePermission("treatments", "update");
    const { id, sectionId } = treatmentSectionIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateTreatmentSectionSchema.parse(body);
    const section = await updateTreatmentSection(id, sectionId, data);

    return NextResponse.json({ success: true, section });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteTreatmentSectionHandler(params: { id: string; sectionId: string }) {
  try {
    await requirePermission("treatments", "update");
    const { id, sectionId } = treatmentSectionIdParamSchema.parse(params);
    await deleteTreatmentSection(id, sectionId);

    return NextResponse.json({ success: true, message: "Section deleted" });
  } catch (error) {
    return handleError(error);
  }
}

export async function reorderTreatmentSectionsHandler(request: NextRequest, params: { id: string }) {
  try {
    await requirePermission("treatments", "update");
    const { id } = treatmentIdParamSchema.parse(params);
    const body = await request.json();
    const { order } = reorderTreatmentSectionsSchema.parse(body);
    const sections = await reorderTreatmentSections(id, order);

    return NextResponse.json({ success: true, sections });
  } catch (error) {
    return handleError(error);
  }
}

export async function uploadTreatmentSectionImageHandler(request: NextRequest) {
  try {
    await requirePermission("treatments", "update");
    const { files } = await parseMultipartFields(request, SECTION_IMAGE_UPLOAD_FIELDS);
    const file = files.image?.[0];

    if (!file) {
      return NextResponse.json({ success: false, message: "An image file is required" }, { status: 400 });
    }

    const path = await uploadTreatmentSectionImage({ buffer: file.buffer, mimeType: file.mimetype });

    return NextResponse.json({ success: true, path }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
