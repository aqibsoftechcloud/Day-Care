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
  bannerIdParamSchema,
  createBannerSchema,
  updateBannerSchema,
} from "@/validators/banner.validator";
import {
  BannerFilesInput,
  BannerImageRequiredError,
  BannerNotFoundError,
  CityNotFoundError,
  createBanner,
  deleteBanner,
  getBannerById,
  getBanners,
  updateBanner,
} from "@/services/banner.service";

const BANNER_UPLOAD_FIELDS = [
  { name: "banner_image", maxCount: 1 },
  { name: "mobile_banner_image", maxCount: 1 },
];

function toFileInput(
  files: Record<string, Express.Multer.File[]>,
  field: string
) {
  const file = files[field]?.[0];

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

  if (
    error instanceof UnsupportedFileTypeError ||
    error instanceof BannerImageRequiredError
  ) {
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

  if (error instanceof BannerNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof CityNotFoundError) {
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
      { success: false, message: "A conflicting banner record already exists" },
      { status: 409 }
    );
  }

  console.error(error);

  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 }
  );
}

export async function listBanners() {
  try {
    await requirePermission("banners", "view");
    const banners = await getBanners();
    return NextResponse.json({ success: true, banners });
  } catch (error) {
    return handleError(error);
  }
}

export async function createBannerHandler(request: NextRequest) {
  try {
    await requirePermission("banners", "create");
    const { fields, files } = await parseMultipartFields(
      request,
      BANNER_UPLOAD_FIELDS
    );
    const data = createBannerSchema.parse(fields);

    const fileInputs: BannerFilesInput = {
      banner_image: toFileInput(files, "banner_image"),
      mobile_banner_image: toFileInput(files, "mobile_banner_image"),
    };

    const banner = await createBanner(data, fileInputs);

    return NextResponse.json({ success: true, banner }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getBannerHandler(params: { id: string }) {
  try {
    await requirePermission("banners", "view");
    const { id } = bannerIdParamSchema.parse(params);
    const banner = await getBannerById(id);

    return NextResponse.json({ success: true, banner });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateBannerHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("banners", "update");
    const { id } = bannerIdParamSchema.parse(params);
    const { fields, files } = await parseMultipartFields(
      request,
      BANNER_UPLOAD_FIELDS
    );
    const data = updateBannerSchema.parse(fields);

    const fileInputs: BannerFilesInput = {
      banner_image: toFileInput(files, "banner_image"),
      mobile_banner_image: toFileInput(files, "mobile_banner_image"),
    };

    const banner = await updateBanner(id, data, fileInputs);

    return NextResponse.json({ success: true, banner });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteBannerHandler(params: { id: string }) {
  try {
    await requirePermission("banners", "delete");
    const { id } = bannerIdParamSchema.parse(params);
    await deleteBanner(id);

    return NextResponse.json({
      success: true,
      message: "Banner deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
