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
  createGlobalTreatmentSectionSchema,
  globalTreatmentIdParamSchema,
  globalTreatmentSectionIdParamSchema,
  reorderGlobalTreatmentSectionsSchema,
  updateGlobalTreatmentSectionSchema,
} from "@/validators/global-treatment-section.validator";
import {
  createGlobalTreatmentSection,
  deleteGlobalTreatmentSection,
  getGlobalTreatmentSections,
  GlobalTreatmentNotFoundError,
  GlobalTreatmentSectionNotFoundError,
  reorderGlobalTreatmentSections,
  updateGlobalTreatmentSection,
  uploadGlobalTreatmentSectionImage,
} from "@/services/global-treatment-section.service";

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

  if (error instanceof UnsupportedFileTypeError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }

  if (error instanceof MulterError) {
    return NextResponse.json({ success: false, message: `Upload error: ${error.message}` }, { status: 400 });
  }

  if (error instanceof GlobalTreatmentNotFoundError || error instanceof GlobalTreatmentSectionNotFoundError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 404 });
  }

  console.error(error);

  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

export async function listGlobalTreatmentSectionsHandler(params: { id: string }) {
  try {
    await requirePermission("global-treatments", "view");
    const { id } = globalTreatmentIdParamSchema.parse(params);
    const sections = await getGlobalTreatmentSections(id);

    return NextResponse.json({ success: true, sections });
  } catch (error) {
    return handleError(error);
  }
}

export async function createGlobalTreatmentSectionHandler(request: NextRequest, params: { id: string }) {
  try {
    await requirePermission("global-treatments", "update");
    const { id } = globalTreatmentIdParamSchema.parse(params);
    const body = await request.json();
    const data = createGlobalTreatmentSectionSchema.parse(body);
    const section = await createGlobalTreatmentSection(id, data);

    return NextResponse.json({ success: true, section }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateGlobalTreatmentSectionHandler(
  request: NextRequest,
  params: { id: string; sectionId: string }
) {
  try {
    await requirePermission("global-treatments", "update");
    const { id, sectionId } = globalTreatmentSectionIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateGlobalTreatmentSectionSchema.parse(body);
    const section = await updateGlobalTreatmentSection(id, sectionId, data);

    return NextResponse.json({ success: true, section });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteGlobalTreatmentSectionHandler(params: { id: string; sectionId: string }) {
  try {
    await requirePermission("global-treatments", "update");
    const { id, sectionId } = globalTreatmentSectionIdParamSchema.parse(params);
    await deleteGlobalTreatmentSection(id, sectionId);

    return NextResponse.json({ success: true, message: "Section deleted" });
  } catch (error) {
    return handleError(error);
  }
}

export async function reorderGlobalTreatmentSectionsHandler(request: NextRequest, params: { id: string }) {
  try {
    await requirePermission("global-treatments", "update");
    const { id } = globalTreatmentIdParamSchema.parse(params);
    const body = await request.json();
    const { order } = reorderGlobalTreatmentSectionsSchema.parse(body);
    const sections = await reorderGlobalTreatmentSections(id, order);

    return NextResponse.json({ success: true, sections });
  } catch (error) {
    return handleError(error);
  }
}

export async function uploadGlobalTreatmentSectionImageHandler(request: NextRequest) {
  try {
    await requirePermission("global-treatments", "update");
    const { files } = await parseMultipartFields(request, SECTION_IMAGE_UPLOAD_FIELDS);
    const file = files.image?.[0];

    if (!file) {
      return NextResponse.json({ success: false, message: "An image file is required" }, { status: 400 });
    }

    const path = await uploadGlobalTreatmentSectionImage({ buffer: file.buffer, mimeType: file.mimetype });

    return NextResponse.json({ success: true, path }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
