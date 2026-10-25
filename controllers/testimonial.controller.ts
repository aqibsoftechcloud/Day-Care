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
  createTestimonialSchema,
  listTestimonialsQuerySchema,
  testimonialIdParamSchema,
  updateTestimonialSchema,
} from "@/validators/testimonial.validator";
import {
  CityNotFoundError,
  createTestimonial,
  deleteTestimonial,
  DoctorNotFoundError,
  getTestimonialById,
  getTestimonials,
  HospitalNotFoundError,
  LanguageNotFoundError,
  LocationCityMismatchError,
  LocationNotFoundError,
  SpecialityNotFoundError,
  TestimonialImageInput,
  TestimonialNotFoundError,
  updateTestimonial,
} from "@/services/testimonial.service";

const TESTIMONIAL_UPLOAD_FIELDS = [{ name: "testimonial_image", maxCount: 1 }];

function toImageInput(
  files: Record<string, Express.Multer.File[]>
): TestimonialImageInput | undefined {
  const file = files.testimonial_image?.[0];

  if (!file) {
    return undefined;
  }

  return { buffer: file.buffer, mimeType: file.mimetype };
}

/**
 * Resolves the three possible states for an update's image:
 * - a new file was uploaded -> replace
 * - the "testimonial_image" text field was sent as an empty string
 *   (multipart has no native null) -> explicit clear
 * - neither -> undefined, meaning "leave the existing image untouched"
 */
function resolveImageInput(
  fields: Record<string, string>,
  files: Record<string, Express.Multer.File[]>
): TestimonialImageInput | null | undefined {
  const file = toImageInput(files);

  if (file) {
    return file;
  }

  if (fields.testimonial_image === "") {
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

  if (
    error instanceof UnsupportedFileTypeError ||
    error instanceof LocationCityMismatchError
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
    error instanceof TestimonialNotFoundError ||
    error instanceof CityNotFoundError ||
    error instanceof LanguageNotFoundError ||
    error instanceof LocationNotFoundError ||
    error instanceof HospitalNotFoundError ||
    error instanceof DoctorNotFoundError ||
    error instanceof SpecialityNotFoundError
  ) {
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
        message: "A testimonial with this SEO URL already exists",
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

export async function listTestimonialsHandler(request: NextRequest) {
  try {
    await requirePermission("testimonials", "view");
    const params = request.nextUrl.searchParams;
    const query = listTestimonialsQuerySchema.parse({
      city_id: params.get("city_id") ?? undefined,
      doctor_id: params.get("doctor_id") ?? undefined,
      hospital_id: params.get("hospital_id") ?? undefined,
      language_id: params.get("language_id") ?? undefined,
      location_id: params.get("location_id") ?? undefined,
      speciality_id: params.get("speciality_id") ?? undefined,
      status: params.get("status") ?? undefined,
    });

    const testimonials = await getTestimonials(query);

    return NextResponse.json({ success: true, testimonials });
  } catch (error) {
    return handleError(error);
  }
}

export async function createTestimonialHandler(request: NextRequest) {
  try {
    await requirePermission("testimonials", "create");
    const { fields, files } = await parseMultipartFields(
      request,
      TESTIMONIAL_UPLOAD_FIELDS
    );
    const data = createTestimonialSchema.parse(fields);
    const image = toImageInput(files);

    const testimonial = await createTestimonial(data, image);

    return NextResponse.json({ success: true, testimonial }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getTestimonialHandler(params: { id: string }) {
  try {
    await requirePermission("testimonials", "view");
    const { id } = testimonialIdParamSchema.parse(params);
    const testimonial = await getTestimonialById(id);

    return NextResponse.json({ success: true, testimonial });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateTestimonialHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("testimonials", "update");
    const { id } = testimonialIdParamSchema.parse(params);
    const { fields, files } = await parseMultipartFields(
      request,
      TESTIMONIAL_UPLOAD_FIELDS
    );
    const data = updateTestimonialSchema.parse(fields);
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

    const testimonial = await updateTestimonial(id, data, image);

    return NextResponse.json({ success: true, testimonial });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteTestimonialHandler(params: { id: string }) {
  try {
    await requirePermission("testimonials", "delete");
    const { id } = testimonialIdParamSchema.parse(params);
    await deleteTestimonial(id);

    return NextResponse.json({
      success: true,
      message: "Testimonial deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
