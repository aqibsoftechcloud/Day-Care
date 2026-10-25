import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requirePermission, tryHandleAuthorizationError } from "@/lib/auth/authorization";
import { MulterError, parseIconMultipartFields, UnsupportedFileTypeError, MAX_ICON_FILE_SIZE_BYTES } from "@/lib/upload";
import { homepageCustomIconIdParamSchema } from "@/validators/homepage-custom-icon.validator";
import {
  createHomepageCustomIcon,
  CustomIconInUseError,
  deleteHomepageCustomIcon,
  HomepageCustomIconNotFoundError,
  InvalidRasterImageError,
  InvalidSvgError,
  listHomepageCustomIcons,
} from "@/services/homepage-custom-icon.service";

const ICON_UPLOAD_FIELDS = [{ name: "file", maxCount: 1 }];

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
    return NextResponse.json(
      { success: false, message: "Only SVG, PNG, WebP, and JPEG icon files are supported." },
      { status: 400 }
    );
  }

  if (error instanceof MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? `Icon files must be ${Math.round(MAX_ICON_FILE_SIZE_BYTES / 1024)}KB or smaller.`
        : `Upload error: ${error.message}`;
    return NextResponse.json({ success: false, message }, { status: 400 });
  }

  if (error instanceof InvalidSvgError || error instanceof InvalidRasterImageError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }

  if (error instanceof HomepageCustomIconNotFoundError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 404 });
  }

  if (error instanceof CustomIconInUseError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 409 });
  }

  console.error(error);

  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

export async function listHomepageCustomIconsHandler() {
  try {
    await requirePermission("homepage-icons", "view");
    const customIcons = await listHomepageCustomIcons();

    return NextResponse.json({ success: true, customIcons });
  } catch (error) {
    return handleError(error);
  }
}

export async function createHomepageCustomIconHandler(request: NextRequest) {
  try {
    await requirePermission("homepage-icons", "update");
    const { files } = await parseIconMultipartFields(request, ICON_UPLOAD_FIELDS);
    const file = files.file?.[0];

    if (!file) {
      return NextResponse.json({ success: false, message: "No file was uploaded." }, { status: 400 });
    }

    const customIcon = await createHomepageCustomIcon({
      buffer: file.buffer,
      mimeType: file.mimetype,
      fileName: file.originalname,
    });

    return NextResponse.json({ success: true, customIcon }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteHomepageCustomIconHandler(params: { id: string }) {
  try {
    await requirePermission("homepage-icons", "update");
    const { id } = homepageCustomIconIdParamSchema.parse(params);
    await deleteHomepageCustomIcon(id);

    return NextResponse.json({ success: true, message: "Custom icon deleted" });
  } catch (error) {
    return handleError(error);
  }
}
