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
  createGlobalSpecialitySchema,
  globalSpecialityIdParamSchema,
  listGlobalSpecialitiesQuerySchema,
  updateGlobalSpecialitySchema,
} from "@/validators/global-speciality.validator";
import { globalSpecialityNavigationPlacementSchema } from "@/validators/global-speciality-navigation.validator";
import {
  createGlobalSpeciality,
  deleteGlobalSpeciality,
  getGlobalSpecialities,
  getGlobalSpecialityById,
  GlobalSeoUrlCollisionError,
  GlobalSpecialityImageInput,
  GlobalSpecialityNotFoundError,
  updateGlobalSpeciality,
} from "@/services/global-speciality.service";
import {
  getGlobalSpecialityNavigationPlacement,
  InvalidMenuTargetError,
  InvalidParentMenuError,
  LanguageNotFoundError,
  ParentMenuCityMismatchError,
  ParentMenuNotFoundError,
  setGlobalSpecialityNavigationPlacement,
} from "@/services/menu.service";

const GLOBAL_SPECIALITY_UPLOAD_FIELDS = [
  { name: "image", maxCount: 1 },
  { name: "card_icon", maxCount: 1 },
];

function toImageInput(
  files: Record<string, Express.Multer.File[]>,
  fieldName: "image" | "card_icon" = "image"
): GlobalSpecialityImageInput | undefined {
  const file = files[fieldName]?.[0];

  if (!file) {
    return undefined;
  }

  return { buffer: file.buffer, mimeType: file.mimetype };
}

/**
 * Resolves the three possible states for an update's image — mirrors
 * controllers/speciality.controller.ts's resolveImageInput() exactly:
 * - a new file was uploaded -> replace
 * - the "image" text field was sent as an empty string (multipart has no
 *   native null) -> explicit clear (admin clicked "Remove")
 * - neither -> undefined, meaning "leave the existing image untouched"
 */
function resolveImageInput(
  fields: Record<string, string>,
  files: Record<string, Express.Multer.File[]>
): GlobalSpecialityImageInput | null | undefined {
  const file = toImageInput(files);

  if (file) {
    return file;
  }

  if (fields.image === "") {
    return null;
  }

  return undefined;
}

/** Card icon update states: new file -> replace; `card_icon` text field sent as "" -> explicit clear (null); neither -> undefined (leave untouched). */
function resolveCardIconInput(
  fields: Record<string, string>,
  files: Record<string, Express.Multer.File[]>
): GlobalSpecialityImageInput | null | undefined {
  const file = toImageInput(files, "card_icon");

  if (file) {
    return file;
  }

  return fields.card_icon === "" ? null : undefined;
}

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

  if (error instanceof GlobalSeoUrlCollisionError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 409 });
  }

  if (error instanceof GlobalSpecialityNotFoundError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 404 });
  }

  if (
    error instanceof InvalidMenuTargetError ||
    error instanceof InvalidParentMenuError ||
    error instanceof ParentMenuCityMismatchError
  ) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }

  if (error instanceof ParentMenuNotFoundError || error instanceof LanguageNotFoundError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 404 });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    // uniqueMenuSeoUrl (services/menu.service.ts) already retries on a
    // seo_url collision, so a P2002 on `menus` here would mean a genuine
    // race with a concurrent request — distinguished from the far more
    // common `global_specialities` collision so the message stays accurate.
    const message =
      error.meta?.modelName === "menus"
        ? "This navigation menu's URL collided with another one — please try saving again."
        : "A global speciality with this SEO URL already exists";
    return NextResponse.json({ success: false, message }, { status: 409 });
  }

  console.error(error);

  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

export async function listGlobalSpecialitiesHandler(request: NextRequest) {
  try {
    await requirePermission("global-specialities", "view");
    const params = request.nextUrl.searchParams;
    const query = listGlobalSpecialitiesQuerySchema.parse({
      status: params.get("status") ?? undefined,
    });

    const globalSpecialities = await getGlobalSpecialities(query);

    return NextResponse.json({ success: true, globalSpecialities });
  } catch (error) {
    return handleError(error);
  }
}

export async function createGlobalSpecialityHandler(request: NextRequest) {
  try {
    await requirePermission("global-specialities", "create");
    const { fields, files } = await parseMultipartFields(request, GLOBAL_SPECIALITY_UPLOAD_FIELDS);
    const data = createGlobalSpecialitySchema.parse(fields);
    const image = toImageInput(files);

    const cardIcon = toImageInput(files, "card_icon");
    const globalSpeciality = await createGlobalSpeciality(data, image, cardIcon);

    return NextResponse.json({ success: true, globalSpeciality }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getGlobalSpecialityHandler(params: { id: string }) {
  try {
    await requirePermission("global-specialities", "view");
    const { id } = globalSpecialityIdParamSchema.parse(params);
    const globalSpeciality = await getGlobalSpecialityById(id);

    return NextResponse.json({ success: true, globalSpeciality });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateGlobalSpecialityHandler(request: NextRequest, params: { id: string }) {
  try {
    await requirePermission("global-specialities", "update");
    const { id } = globalSpecialityIdParamSchema.parse(params);
    const { fields, files } = await parseMultipartFields(request, GLOBAL_SPECIALITY_UPLOAD_FIELDS);
    const data = updateGlobalSpecialitySchema.parse(fields);
    const image = resolveImageInput(fields, files);
    const cardIcon = resolveCardIconInput(fields, files);

    if (Object.keys(data).length === 0 && image === undefined && cardIcon === undefined) {
      return NextResponse.json(
        { success: false, message: "At least one field or a new image must be provided" },
        { status: 400 }
      );
    }

    const globalSpeciality = await updateGlobalSpeciality(id, data, image, cardIcon);

    return NextResponse.json({ success: true, globalSpeciality });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteGlobalSpecialityHandler(params: { id: string }) {
  try {
    await requirePermission("global-specialities", "delete");
    const { id } = globalSpecialityIdParamSchema.parse(params);
    await deleteGlobalSpeciality(id);

    return NextResponse.json({ success: true, message: "Global speciality deactivated" });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * The Navigation tab's read — both module permissions are required since
 * this reads the `menus` table through the global speciality's own id,
 * not a standalone menu id (see setGlobalSpecialityNavigationHandler's
 * doc comment for why both are required on the write side too).
 */
export async function getGlobalSpecialityNavigationHandler(params: { id: string }) {
  try {
    await requirePermission("global-specialities", "view");
    await requirePermission("menu-management", "view");
    const { id } = globalSpecialityIdParamSchema.parse(params);
    await getGlobalSpecialityById(id); // 404s consistently if the speciality itself doesn't exist
    const placement = await getGlobalSpecialityNavigationPlacement(id);

    return NextResponse.json({ success: true, placement });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * The Navigation tab's write — creates, updates, or hides the one `menus`
 * row for this speciality (see services/menu.service.ts's
 * setGlobalSpecialityNavigationPlacement). Requires BOTH
 * "global-specialities:update" (this is, after all, part of editing the
 * speciality) AND "menu-management:update" (it's also, unavoidably, a
 * write to the navigation system) — an admin needs both to use this tab,
 * exactly as they would need both to achieve the same result by hand
 * (editing the speciality, then separately editing Menu Management).
 */
export async function setGlobalSpecialityNavigationHandler(request: NextRequest, params: { id: string }) {
  try {
    await requirePermission("global-specialities", "update");
    await requirePermission("menu-management", "update");
    const { id } = globalSpecialityIdParamSchema.parse(params);
    const body = await request.json();
    const data = globalSpecialityNavigationPlacementSchema.parse(body);

    const placement = await setGlobalSpecialityNavigationPlacement(id, data);

    return NextResponse.json({ success: true, placement });
  } catch (error) {
    return handleError(error);
  }
}
