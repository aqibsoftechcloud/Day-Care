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
  createNewsMediaSchema,
  listNewsMediaQuerySchema,
  newsMediaIdParamSchema,
  updateNewsMediaSchema,
} from "@/validators/news-media.validator";
import {
  createNewsMedia,
  deleteNewsMedia,
  getNewsMediaById,
  getNewsMediaList,
  NewsMediaImageInput,
  NewsMediaNotFoundError,
  updateNewsMedia,
} from "@/services/news-media.service";

const NEWS_MEDIA_UPLOAD_FIELDS = [{ name: "view_image", maxCount: 1 }];

function toImageInput(
  files: Record<string, Express.Multer.File[]>
): NewsMediaImageInput | undefined {
  const file = files.view_image?.[0];

  if (!file) {
    return undefined;
  }

  return { buffer: file.buffer, mimeType: file.mimetype };
}

/**
 * Resolves the three possible states for an update's image:
 * - a new file was uploaded -> replace
 * - the "view_image" text field was sent as an empty string (multipart
 *   has no native null) -> explicit clear
 * - neither -> undefined, meaning "leave the existing image untouched"
 */
function resolveImageInput(
  fields: Record<string, string>,
  files: Record<string, Express.Multer.File[]>
): NewsMediaImageInput | null | undefined {
  const file = toImageInput(files);

  if (file) {
    return file;
  }

  if (fields.view_image === "") {
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
      {
        success: false,
        message: "Validation failed",
        errors: error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  if (error instanceof UnsupportedFileTypeError) {
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

  if (error instanceof NewsMediaNotFoundError) {
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
        message: "A conflicting news & media record already exists",
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

export async function listNewsMediaHandler(request: NextRequest) {
  try {
    await requirePermission("news-and-media", "view");
    const query = listNewsMediaQuerySchema.parse({
      status: request.nextUrl.searchParams.get("status") ?? undefined,
    });

    const newsMedia = await getNewsMediaList(query);

    return NextResponse.json({ success: true, newsMedia });
  } catch (error) {
    return handleError(error);
  }
}

export async function createNewsMediaHandler(request: NextRequest) {
  try {
    await requirePermission("news-and-media", "create");
    const { fields, files } = await parseMultipartFields(
      request,
      NEWS_MEDIA_UPLOAD_FIELDS
    );
    const data = createNewsMediaSchema.parse(fields);
    const image = toImageInput(files);

    const newsMediaItem = await createNewsMedia(data, image);

    return NextResponse.json(
      { success: true, newsMediaItem },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function getNewsMediaHandler(params: { id: string }) {
  try {
    await requirePermission("news-and-media", "view");
    const { id } = newsMediaIdParamSchema.parse(params);
    const newsMediaItem = await getNewsMediaById(id);

    return NextResponse.json({ success: true, newsMediaItem });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateNewsMediaHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("news-and-media", "update");
    const { id } = newsMediaIdParamSchema.parse(params);
    const { fields, files } = await parseMultipartFields(
      request,
      NEWS_MEDIA_UPLOAD_FIELDS
    );
    const data = updateNewsMediaSchema.parse(fields);
    const image = resolveImageInput(fields, files);

    if (Object.keys(data).length === 0 && image === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one field or an image change must be provided",
        },
        { status: 400 }
      );
    }

    const newsMediaItem = await updateNewsMedia(id, data, image);

    return NextResponse.json({ success: true, newsMediaItem });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteNewsMediaHandler(params: { id: string }) {
  try {
    await requirePermission("news-and-media", "delete");
    const { id } = newsMediaIdParamSchema.parse(params);
    await deleteNewsMedia(id);

    return NextResponse.json({
      success: true,
      message: "News & media item deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
