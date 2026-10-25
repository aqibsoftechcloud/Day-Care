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
  createPageSectionSchema,
  pageIdParamSchema,
  pageSectionIdParamSchema,
  reorderPageSectionsSchema,
  updatePageSectionSchema,
} from "@/validators/page-section.validator";
import {
  createPageSection,
  deletePageSection,
  duplicatePageSection,
  getPageSectionById,
  getPageSections,
  InvalidSectionContentError,
  PageNotFoundError,
  PageSectionNotFoundError,
  reorderPageSections,
  updatePageSection,
  uploadPageSectionImage,
} from "@/services/page-section.service";

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

  if (error instanceof InvalidSectionContentError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }

  if (error instanceof UnsupportedFileTypeError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }

  if (error instanceof MulterError) {
    return NextResponse.json({ success: false, message: `Upload error: ${error.message}` }, { status: 400 });
  }

  if (error instanceof PageNotFoundError || error instanceof PageSectionNotFoundError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 404 });
  }

  console.error(error);

  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

export async function listPageSectionsHandler(params: { id: string }) {
  try {
    await requirePermission("pages", "view");
    const { id } = pageIdParamSchema.parse(params);
    const sections = await getPageSections(id);

    return NextResponse.json({ success: true, sections });
  } catch (error) {
    return handleError(error);
  }
}

export async function createPageSectionHandler(request: NextRequest, params: { id: string }) {
  try {
    await requirePermission("pages", "update");
    const { id } = pageIdParamSchema.parse(params);
    const body = await request.json();
    const data = createPageSectionSchema.parse(body);
    const section = await createPageSection(id, data);

    return NextResponse.json({ success: true, section }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getPageSectionHandler(params: { id: string; sectionId: string }) {
  try {
    await requirePermission("pages", "view");
    const { id, sectionId } = pageSectionIdParamSchema.parse(params);
    const section = await getPageSectionById(id, sectionId);

    return NextResponse.json({ success: true, section });
  } catch (error) {
    return handleError(error);
  }
}

export async function updatePageSectionHandler(
  request: NextRequest,
  params: { id: string; sectionId: string }
) {
  try {
    await requirePermission("pages", "update");
    const { id, sectionId } = pageSectionIdParamSchema.parse(params);
    const body = await request.json();
    const data = updatePageSectionSchema.parse(body);
    const section = await updatePageSection(id, sectionId, data);

    return NextResponse.json({ success: true, section });
  } catch (error) {
    return handleError(error);
  }
}

export async function deletePageSectionHandler(params: { id: string; sectionId: string }) {
  try {
    await requirePermission("pages", "update");
    const { id, sectionId } = pageSectionIdParamSchema.parse(params);
    await deletePageSection(id, sectionId);

    return NextResponse.json({ success: true, message: "Section deleted" });
  } catch (error) {
    return handleError(error);
  }
}

export async function duplicatePageSectionHandler(params: { id: string; sectionId: string }) {
  try {
    await requirePermission("pages", "update");
    const { id, sectionId } = pageSectionIdParamSchema.parse(params);
    const section = await duplicatePageSection(id, sectionId);

    return NextResponse.json({ success: true, section }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function reorderPageSectionsHandler(request: NextRequest, params: { id: string }) {
  try {
    await requirePermission("pages", "update");
    const { id } = pageIdParamSchema.parse(params);
    const body = await request.json();
    const { order } = reorderPageSectionsSchema.parse(body);
    const sections = await reorderPageSections(id, order);

    return NextResponse.json({ success: true, sections });
  } catch (error) {
    return handleError(error);
  }
}

export async function uploadPageSectionImageHandler(request: NextRequest) {
  try {
    await requirePermission("pages", "update");
    const { files } = await parseMultipartFields(request, SECTION_IMAGE_UPLOAD_FIELDS);
    const file = files.image?.[0];

    if (!file) {
      return NextResponse.json({ success: false, message: "An image file is required" }, { status: 400 });
    }

    const path = await uploadPageSectionImage({ buffer: file.buffer, mimeType: file.mimetype });

    return NextResponse.json({ success: true, path }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
