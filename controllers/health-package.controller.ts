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
  createHealthPackageSchema,
  healthPackageIdParamSchema,
  listHealthPackagesQuerySchema,
  updateHealthPackageSchema,
} from "@/validators/health-package.validator";
import {
  createHealthPackage,
  deleteHealthPackage,
  getHealthPackageById,
  getHealthPackages,
  HealthPackageImageInput,
  HealthPackageNotFoundError,
  updateHealthPackage,
} from "@/services/health-package.service";

const HEALTH_PACKAGE_UPLOAD_FIELDS = [{ name: "pack_image", maxCount: 1 }];

function toImageInput(
  files: Record<string, Express.Multer.File[]>
): HealthPackageImageInput | undefined {
  const file = files.pack_image?.[0];

  if (!file) {
    return undefined;
  }

  return { buffer: file.buffer, mimeType: file.mimetype };
}

/**
 * Resolves the three possible states for an update's image:
 * - a new file was uploaded -> replace
 * - the "pack_image" text field was sent as an empty string (multipart
 *   has no native null) -> explicit clear
 * - neither -> undefined, meaning "leave the existing image untouched"
 */
function resolveImageInput(
  fields: Record<string, string>,
  files: Record<string, Express.Multer.File[]>
): HealthPackageImageInput | null | undefined {
  const file = toImageInput(files);

  if (file) {
    return file;
  }

  if (fields.pack_image === "") {
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

  if (error instanceof HealthPackageNotFoundError) {
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
        message: "A health package with this SEO URL already exists",
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

export async function listHealthPackagesHandler(request: NextRequest) {
  try {
    await requirePermission("packages", "view");
    const query = listHealthPackagesQuerySchema.parse({
      status: request.nextUrl.searchParams.get("status") ?? undefined,
    });

    const healthPackages = await getHealthPackages(query);

    return NextResponse.json({ success: true, healthPackages });
  } catch (error) {
    return handleError(error);
  }
}

export async function createHealthPackageHandler(request: NextRequest) {
  try {
    await requirePermission("packages", "create");
    const { fields, files } = await parseMultipartFields(
      request,
      HEALTH_PACKAGE_UPLOAD_FIELDS
    );
    const data = createHealthPackageSchema.parse(fields);
    const image = toImageInput(files);

    const healthPackage = await createHealthPackage(data, image);

    return NextResponse.json(
      { success: true, healthPackage },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function getHealthPackageHandler(params: { id: string }) {
  try {
    await requirePermission("packages", "view");
    const { id } = healthPackageIdParamSchema.parse(params);
    const healthPackage = await getHealthPackageById(id);

    return NextResponse.json({ success: true, healthPackage });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateHealthPackageHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("packages", "update");
    const { id } = healthPackageIdParamSchema.parse(params);
    const { fields, files } = await parseMultipartFields(
      request,
      HEALTH_PACKAGE_UPLOAD_FIELDS
    );
    const data = updateHealthPackageSchema.parse(fields);
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

    const healthPackage = await updateHealthPackage(id, data, image);

    return NextResponse.json({ success: true, healthPackage });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteHealthPackageHandler(params: { id: string }) {
  try {
    await requirePermission("packages", "delete");
    const { id } = healthPackageIdParamSchema.parse(params);
    await deleteHealthPackage(id);

    return NextResponse.json({
      success: true,
      message: "Health package deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
