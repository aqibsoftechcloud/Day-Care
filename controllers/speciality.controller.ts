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
  createSpecialitySchema,
  listSpecialitiesQuerySchema,
  specialityIdParamSchema,
  updateSpecialitySchema,
} from "@/validators/speciality.validator";
import {
  CityNotFoundError,
  createSpeciality,
  deleteSpeciality,
  DoctorSpecialityNotFoundError,
  GlobalSpecialityNotFoundError,
  getSpecialities,
  getSpecialityById,
  HospitalNotFoundError,
  InvalidParentSpecialityError,
  LocationCityMismatchError,
  LocationNotFoundError,
  ParentSpecialityNotFoundError,
  SpecialityHasActiveChildrenError,
  SpecialityImageInput,
  SpecialityNotFoundError,
  updateSpeciality,
} from "@/services/speciality.service";

const SPECIALITY_UPLOAD_FIELDS = [
  { name: "speciality_logo", maxCount: 1 },
  { name: "card_icon", maxCount: 1 },
];

function toImageInput(
  files: Record<string, Express.Multer.File[]>,
  fieldName: "speciality_logo" | "card_icon" = "speciality_logo"
): SpecialityImageInput | undefined {
  const file = files[fieldName]?.[0];

  if (!file) {
    return undefined;
  }

  return { buffer: file.buffer, mimeType: file.mimetype };
}

/**
 * Resolves the three possible states for an update's logo — mirrors
 * controllers/doctor.controller.ts's resolveImageInput() exactly:
 * - a new file was uploaded -> replace
 * - the "speciality_logo" text field was sent as an empty string
 *   (multipart has no native null) -> explicit clear (admin clicked "Remove")
 * - neither -> undefined, meaning "leave the existing logo untouched"
 */
function resolveImageInput(
  fields: Record<string, string>,
  files: Record<string, Express.Multer.File[]>
): SpecialityImageInput | null | undefined {
  const file = toImageInput(files);

  if (file) {
    return file;
  }

  if (fields.speciality_logo === "") {
    return null;
  }

  return undefined;
}

/** Card icon update states: new file -> replace; `card_icon` text field sent as "" -> explicit clear (null); neither -> undefined (leave untouched). */
function resolveCardIconInput(
  fields: Record<string, string>,
  files: Record<string, Express.Multer.File[]>
): SpecialityImageInput | null | undefined {
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
      {
        success: false,
        message: "Validation failed",
        errors: error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  if (
    error instanceof InvalidParentSpecialityError ||
    error instanceof LocationCityMismatchError ||
    error instanceof UnsupportedFileTypeError
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

  if (
    error instanceof SpecialityNotFoundError ||
    error instanceof CityNotFoundError ||
    error instanceof LocationNotFoundError ||
    error instanceof HospitalNotFoundError ||
    error instanceof ParentSpecialityNotFoundError ||
    error instanceof DoctorSpecialityNotFoundError ||
    error instanceof GlobalSpecialityNotFoundError
  ) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof SpecialityHasActiveChildrenError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 409 }
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "A speciality with this SEO URL already exists",
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

export async function listSpecialitiesHandler(request: NextRequest) {
  try {
    await requirePermission("specialities", "view");
    const params = request.nextUrl.searchParams;
    const query = listSpecialitiesQuerySchema.parse({
      city_id: params.get("city_id") ?? undefined,
      location_id: params.get("location_id") ?? undefined,
      hospital_id: params.get("hospital_id") ?? undefined,
      parent_speciality_id: params.get("parent_speciality_id") ?? undefined,
      global_speciality_id: params.get("global_speciality_id") ?? undefined,
      status: params.get("status") ?? undefined,
    });

    const specialities = await getSpecialities(query);

    return NextResponse.json({ success: true, specialities });
  } catch (error) {
    return handleError(error);
  }
}

export async function createSpecialityHandler(request: NextRequest) {
  try {
    await requirePermission("specialities", "create");
    const { fields, files } = await parseMultipartFields(
      request,
      SPECIALITY_UPLOAD_FIELDS
    );
    const data = createSpecialitySchema.parse(fields);
    const image = toImageInput(files);
    const cardIcon = toImageInput(files, "card_icon");
    const speciality = await createSpeciality(data, image, cardIcon);

    return NextResponse.json({ success: true, speciality }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getSpecialityHandler(params: { id: string }) {
  try {
    await requirePermission("specialities", "view");
    const { id } = specialityIdParamSchema.parse(params);
    const speciality = await getSpecialityById(id);

    return NextResponse.json({ success: true, speciality });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateSpecialityHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("specialities", "update");
    const { id } = specialityIdParamSchema.parse(params);
    const { fields, files } = await parseMultipartFields(
      request,
      SPECIALITY_UPLOAD_FIELDS
    );
    const data = updateSpecialitySchema.parse(fields);
    const image = resolveImageInput(fields, files);
    const cardIcon = resolveCardIconInput(fields, files);

    if (Object.keys(data).length === 0 && image === undefined && cardIcon === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one field or a logo change must be provided",
        },
        { status: 400 }
      );
    }

    const speciality = await updateSpeciality(id, data, image, cardIcon);

    return NextResponse.json({ success: true, speciality });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteSpecialityHandler(params: { id: string }) {
  try {
    await requirePermission("specialities", "delete");
    const { id } = specialityIdParamSchema.parse(params);
    await deleteSpeciality(id);

    return NextResponse.json({
      success: true,
      message: "Speciality deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
