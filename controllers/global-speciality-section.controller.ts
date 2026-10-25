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
  createGlobalSpecialitySectionSchema,
  globalSpecialityIdParamSchema,
  globalSpecialitySectionIdParamSchema,
  reorderGlobalSpecialitySectionsSchema,
  updateGlobalSpecialitySectionSchema,
} from "@/validators/global-speciality-section.validator";
import {
  createGlobalSpecialitySection,
  deleteGlobalSpecialitySection,
  getGlobalSpecialitySections,
  GlobalSpecialityNotFoundError,
  GlobalSpecialitySectionNotFoundError,
  reorderGlobalSpecialitySections,
  updateGlobalSpecialitySection,
  uploadGlobalSpecialitySectionImage,
} from "@/services/global-speciality-section.service";

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

  if (error instanceof GlobalSpecialityNotFoundError || error instanceof GlobalSpecialitySectionNotFoundError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 404 });
  }

  console.error(error);

  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

export async function listGlobalSpecialitySectionsHandler(params: { id: string }) {
  try {
    await requirePermission("global-specialities", "view");
    const { id } = globalSpecialityIdParamSchema.parse(params);
    const sections = await getGlobalSpecialitySections(id);

    return NextResponse.json({ success: true, sections });
  } catch (error) {
    return handleError(error);
  }
}

export async function createGlobalSpecialitySectionHandler(request: NextRequest, params: { id: string }) {
  try {
    await requirePermission("global-specialities", "update");
    const { id } = globalSpecialityIdParamSchema.parse(params);
    const body = await request.json();
    const data = createGlobalSpecialitySectionSchema.parse(body);
    const section = await createGlobalSpecialitySection(id, data);

    return NextResponse.json({ success: true, section }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateGlobalSpecialitySectionHandler(
  request: NextRequest,
  params: { id: string; sectionId: string }
) {
  try {
    await requirePermission("global-specialities", "update");
    const { id, sectionId } = globalSpecialitySectionIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateGlobalSpecialitySectionSchema.parse(body);
    const section = await updateGlobalSpecialitySection(id, sectionId, data);

    return NextResponse.json({ success: true, section });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteGlobalSpecialitySectionHandler(params: { id: string; sectionId: string }) {
  try {
    await requirePermission("global-specialities", "update");
    const { id, sectionId } = globalSpecialitySectionIdParamSchema.parse(params);
    await deleteGlobalSpecialitySection(id, sectionId);

    return NextResponse.json({ success: true, message: "Section deleted" });
  } catch (error) {
    return handleError(error);
  }
}

export async function reorderGlobalSpecialitySectionsHandler(request: NextRequest, params: { id: string }) {
  try {
    await requirePermission("global-specialities", "update");
    const { id } = globalSpecialityIdParamSchema.parse(params);
    const body = await request.json();
    const { order } = reorderGlobalSpecialitySectionsSchema.parse(body);
    const sections = await reorderGlobalSpecialitySections(id, order);

    return NextResponse.json({ success: true, sections });
  } catch (error) {
    return handleError(error);
  }
}

export async function uploadGlobalSpecialitySectionImageHandler(request: NextRequest) {
  try {
    await requirePermission("global-specialities", "update");
    const { files } = await parseMultipartFields(request, SECTION_IMAGE_UPLOAD_FIELDS);
    const file = files.image?.[0];

    if (!file) {
      return NextResponse.json({ success: false, message: "An image file is required" }, { status: 400 });
    }

    const path = await uploadGlobalSpecialitySectionImage({ buffer: file.buffer, mimeType: file.mimetype });

    return NextResponse.json({ success: true, path }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
