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
  createGallerySchema,
  galleryIdParamSchema,
  listGalleryQuerySchema,
  updateGallerySchema,
} from "@/validators/gallery.validator";
import {
  createGalleryItem,
  deleteGalleryItem,
  GalleryImageInput,
  GalleryNotFoundError,
  getGalleryItemById,
  getGalleryItems,
  updateGalleryItem,
} from "@/services/gallery.service";

const GALLERY_UPLOAD_FIELDS = [{ name: "image", maxCount: 1 }];

function toImageInput(files: Record<string, Express.Multer.File[]>): GalleryImageInput | undefined {
  const file = files.image?.[0];

  if (!file) {
    return undefined;
  }

  return { buffer: file.buffer, mimeType: file.mimetype };
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
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }

  if (error instanceof MulterError) {
    return NextResponse.json({ success: false, message: `Upload error: ${error.message}` }, { status: 400 });
  }

  if (error instanceof GalleryNotFoundError) {
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
        message: "A gallery item with this SEO URL already exists",
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

export async function listGalleryHandler(request: NextRequest) {
  try {
    await requirePermission("gallery", "view");
    const params = request.nextUrl.searchParams;
    const query = listGalleryQuerySchema.parse({
      gallery_type: params.get("gallery_type") ?? undefined,
      gallery_status: params.get("gallery_status") ?? undefined,
      hospital_id: params.get("hospital_id") ?? undefined,
    });

    const gallery = await getGalleryItems(query);

    return NextResponse.json({ success: true, gallery });
  } catch (error) {
    return handleError(error);
  }
}

export async function createGalleryHandler(request: NextRequest) {
  try {
    await requirePermission("gallery", "create");
    const { fields, files } = await parseMultipartFields(request, GALLERY_UPLOAD_FIELDS);
    const data = createGallerySchema.parse(fields);
    const image = toImageInput(files);
    const galleryItem = await createGalleryItem(data, image);

    return NextResponse.json(
      { success: true, galleryItem },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function getGalleryHandler(params: { id: string }) {
  try {
    await requirePermission("gallery", "view");
    const { id } = galleryIdParamSchema.parse(params);
    const galleryItem = await getGalleryItemById(id);

    return NextResponse.json({ success: true, galleryItem });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateGalleryHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("gallery", "update");
    const { id } = galleryIdParamSchema.parse(params);
    const { fields, files } = await parseMultipartFields(request, GALLERY_UPLOAD_FIELDS);
    const data = updateGallerySchema.parse(fields);
    const image = toImageInput(files);
    const galleryItem = await updateGalleryItem(id, data, image);

    return NextResponse.json({ success: true, galleryItem });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteGalleryHandler(params: { id: string }) {
  try {
    await requirePermission("gallery", "delete");
    const { id } = galleryIdParamSchema.parse(params);
    await deleteGalleryItem(id);

    return NextResponse.json({
      success: true,
      message: "Gallery item deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
