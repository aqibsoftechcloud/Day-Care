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
  createSpecialitySectionSchema,
  specialityIdParamSchema,
  specialitySectionIdParamSchema,
  reorderSpecialitySectionsSchema,
  updateSpecialitySectionSchema,
} from "@/validators/speciality-section.validator";
import {
  CannotDeleteFixedSectionError,
  createSpecialitySection,
  deleteSpecialitySection,
  getOrCreateSpecialitySections,
  InvalidSectionContentError,
  reorderSpecialitySections,
  SpecialityNotFoundError,
  SpecialitySectionNotFoundError,
  updateSpecialitySection,
  uploadSpecialitySectionImage,
} from "@/services/speciality-section.service";

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

  if (error instanceof SpecialityNotFoundError || error instanceof SpecialitySectionNotFoundError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 404 });
  }

  console.error(error);

  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

export async function listSpecialitySectionsHandler(params: { id: string }) {
  try {
    await requirePermission("specialities", "view");
    const { id } = specialityIdParamSchema.parse(params);
    const sections = await getOrCreateSpecialitySections(id);

    return NextResponse.json({ success: true, sections });
  } catch (error) {
    return handleError(error);
  }
}

export async function createSpecialitySectionHandler(request: NextRequest, params: { id: string }) {
  try {
    await requirePermission("specialities", "update");
    const { id } = specialityIdParamSchema.parse(params);
    const body = await request.json();
    const data = createSpecialitySectionSchema.parse(body);
    const section = await createSpecialitySection(id, data);

    return NextResponse.json({ success: true, section }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateSpecialitySectionHandler(
  request: NextRequest,
  params: { id: string; sectionId: string }
) {
  try {
    await requirePermission("specialities", "update");
    const { id, sectionId } = specialitySectionIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateSpecialitySectionSchema.parse(body);
    const section = await updateSpecialitySection(id, sectionId, data);

    return NextResponse.json({ success: true, section });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteSpecialitySectionHandler(params: { id: string; sectionId: string }) {
  try {
    await requirePermission("specialities", "update");
    const { id, sectionId } = specialitySectionIdParamSchema.parse(params);
    await deleteSpecialitySection(id, sectionId);

    return NextResponse.json({ success: true, message: "Section deleted" });
  } catch (error) {
    return handleError(error);
  }
}

export async function reorderSpecialitySectionsHandler(request: NextRequest, params: { id: string }) {
  try {
    await requirePermission("specialities", "update");
    const { id } = specialityIdParamSchema.parse(params);
    const body = await request.json();
    const { order } = reorderSpecialitySectionsSchema.parse(body);
    const sections = await reorderSpecialitySections(id, order);

    return NextResponse.json({ success: true, sections });
  } catch (error) {
    return handleError(error);
  }
}

export async function uploadSpecialitySectionImageHandler(request: NextRequest) {
  try {
    await requirePermission("specialities", "update");
    const { files } = await parseMultipartFields(request, SECTION_IMAGE_UPLOAD_FIELDS);
    const file = files.image?.[0];

    if (!file) {
      return NextResponse.json({ success: false, message: "An image file is required" }, { status: 400 });
    }

    const path = await uploadSpecialitySectionImage({ buffer: file.buffer, mimeType: file.mimetype });

    return NextResponse.json({ success: true, path }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
