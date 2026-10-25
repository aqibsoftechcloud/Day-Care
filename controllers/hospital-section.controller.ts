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
  createHospitalSectionSchema,
  hospitalIdParamSchema,
  hospitalSectionIdParamSchema,
  reorderHospitalSectionsSchema,
  updateHospitalSectionSchema,
} from "@/validators/hospital-section.validator";
import {
  CannotDeleteFixedSectionError,
  createHospitalSection,
  deleteHospitalSection,
  getOrCreateHospitalSections,
  HospitalNotFoundError,
  HospitalSectionNotFoundError,
  InvalidSectionContentError,
  reorderHospitalSections,
  updateHospitalSection,
  uploadHospitalSectionImage,
} from "@/services/hospital-section.service";

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

  if (error instanceof HospitalNotFoundError || error instanceof HospitalSectionNotFoundError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 404 });
  }

  console.error(error);

  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

export async function listHospitalSectionsHandler(params: { id: string }) {
  try {
    await requirePermission("hospitals", "view");
    const { id } = hospitalIdParamSchema.parse(params);
    const sections = await getOrCreateHospitalSections(id);

    return NextResponse.json({ success: true, sections });
  } catch (error) {
    return handleError(error);
  }
}

export async function createHospitalSectionHandler(request: NextRequest, params: { id: string }) {
  try {
    await requirePermission("hospitals", "update");
    const { id } = hospitalIdParamSchema.parse(params);
    const body = await request.json();
    const data = createHospitalSectionSchema.parse(body);
    const section = await createHospitalSection(id, data);

    return NextResponse.json({ success: true, section }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateHospitalSectionHandler(
  request: NextRequest,
  params: { id: string; sectionId: string }
) {
  try {
    await requirePermission("hospitals", "update");
    const { id, sectionId } = hospitalSectionIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateHospitalSectionSchema.parse(body);
    const section = await updateHospitalSection(id, sectionId, data);

    return NextResponse.json({ success: true, section });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteHospitalSectionHandler(params: { id: string; sectionId: string }) {
  try {
    await requirePermission("hospitals", "update");
    const { id, sectionId } = hospitalSectionIdParamSchema.parse(params);
    await deleteHospitalSection(id, sectionId);

    return NextResponse.json({ success: true, message: "Section deleted" });
  } catch (error) {
    return handleError(error);
  }
}

export async function reorderHospitalSectionsHandler(request: NextRequest, params: { id: string }) {
  try {
    await requirePermission("hospitals", "update");
    const { id } = hospitalIdParamSchema.parse(params);
    const body = await request.json();
    const { order } = reorderHospitalSectionsSchema.parse(body);
    const sections = await reorderHospitalSections(id, order);

    return NextResponse.json({ success: true, sections });
  } catch (error) {
    return handleError(error);
  }
}

export async function uploadHospitalSectionImageHandler(request: NextRequest) {
  try {
    await requirePermission("hospitals", "update");
    const { files } = await parseMultipartFields(request, SECTION_IMAGE_UPLOAD_FIELDS);
    const file = files.image?.[0];

    if (!file) {
      return NextResponse.json({ success: false, message: "An image file is required" }, { status: 400 });
    }

    const path = await uploadHospitalSectionImage({ buffer: file.buffer, mimeType: file.mimetype });

    return NextResponse.json({ success: true, path }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
