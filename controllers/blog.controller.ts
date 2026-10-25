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
  blogIdParamSchema,
  createBlogSchema,
  listBlogsQuerySchema,
  setBlogRelatedContentSchema,
  updateBlogSchema,
} from "@/validators/blog.validator";
import {
  BlogCategoryNotFoundError,
  BlogCityRequiredError,
  BlogImageInput,
  BlogNotFoundError,
  CityNotFoundError,
  createBlog,
  deleteBlog,
  getBlogById,
  getBlogs,
  GlobalSpecialityNotFoundError,
  GlobalTreatmentNotFoundError,
  LanguageNotFoundError,
  setBlogRelatedContent,
  updateBlog,
} from "@/services/blog.service";

const BLOG_UPLOAD_FIELDS = [
  { name: "blog_image", maxCount: 1 },
  { name: "author_image", maxCount: 1 },
];

function toImageInput(
  files: Record<string, Express.Multer.File[]>,
  fieldName: "blog_image" | "author_image"
): BlogImageInput | undefined {
  const file = files[fieldName]?.[0];

  if (!file) {
    return undefined;
  }

  return { buffer: file.buffer, mimeType: file.mimetype };
}

/**
 * Resolves the three possible states for an update's image field:
 * - a new file was uploaded -> replace
 * - the field's text value was sent as an empty string (multipart has no
 *   native null) -> explicit clear
 * - neither -> undefined, meaning "leave the existing image untouched"
 *
 * Shared by `blog_image` and `author_image` — same convention, independent
 * fields.
 */
function resolveImageInput(
  fields: Record<string, string>,
  files: Record<string, Express.Multer.File[]>,
  fieldName: "blog_image" | "author_image"
): BlogImageInput | null | undefined {
  const file = toImageInput(files, fieldName);

  if (file) {
    return file;
  }

  if (fields[fieldName] === "") {
    return null;
  }

  return undefined;
}

function handleError(error: unknown) {
  if (error instanceof BlogCityRequiredError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }

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

  if (
    error instanceof BlogNotFoundError ||
    error instanceof BlogCategoryNotFoundError ||
    error instanceof LanguageNotFoundError ||
    error instanceof CityNotFoundError ||
    error instanceof GlobalSpecialityNotFoundError ||
    error instanceof GlobalTreatmentNotFoundError
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
        message: "A blog with this SEO URL already exists",
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

export async function listBlogsHandler(request: NextRequest) {
  try {
    await requirePermission("blogs", "view");
    const params = request.nextUrl.searchParams;
    const query = listBlogsQuerySchema.parse({
      blog_category_id: params.get("blog_category_id") ?? undefined,
      language_id: params.get("language_id") ?? undefined,
      city_id: params.get("city_id") ?? undefined,
      scope: params.get("scope") ?? undefined,
      blog_status: params.get("blog_status") ?? undefined,
      related_global_speciality_id: params.get("related_global_speciality_id") ?? undefined,
      related_global_treatment_id: params.get("related_global_treatment_id") ?? undefined,
    });

    const blogs = await getBlogs(query);

    return NextResponse.json({ success: true, blogs });
  } catch (error) {
    return handleError(error);
  }
}

export async function createBlogHandler(request: NextRequest) {
  try {
    await requirePermission("blogs", "create");
    const { fields, files } = await parseMultipartFields(
      request,
      BLOG_UPLOAD_FIELDS
    );
    const data = createBlogSchema.parse(fields);
    const image = toImageInput(files, "blog_image");
    const authorImage = toImageInput(files, "author_image");

    const blog = await createBlog(data, image, authorImage);

    return NextResponse.json({ success: true, blog }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getBlogHandler(params: { id: string }) {
  try {
    await requirePermission("blogs", "view");
    const { id } = blogIdParamSchema.parse(params);
    const blog = await getBlogById(id);

    return NextResponse.json({ success: true, blog });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateBlogHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("blogs", "update");
    const { id } = blogIdParamSchema.parse(params);
    const { fields, files } = await parseMultipartFields(
      request,
      BLOG_UPLOAD_FIELDS
    );
    const data = updateBlogSchema.parse(fields);
    const image = resolveImageInput(fields, files, "blog_image");
    const authorImage = resolveImageInput(fields, files, "author_image");

    if (Object.keys(data).length === 0 && image === undefined && authorImage === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one field or an image change must be provided",
        },
        { status: 400 }
      );
    }

    const blog = await updateBlog(id, data, image, authorImage);

    return NextResponse.json({ success: true, blog });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteBlogHandler(params: { id: string }) {
  try {
    await requirePermission("blogs", "delete");
    const { id } = blogIdParamSchema.parse(params);
    await deleteBlog(id);

    return NextResponse.json({
      success: true,
      message: "Blog deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}

/** The Blog form's Related Specialities/Treatments save step — a plain JSON body (no file upload involved), unlike the other blog handlers above. */
export async function setBlogRelatedContentHandler(request: NextRequest, params: { id: string }) {
  try {
    await requirePermission("blogs", "update");
    const { id } = blogIdParamSchema.parse(params);
    const body = await request.json();
    const data = setBlogRelatedContentSchema.parse(body);

    const blog = await setBlogRelatedContent(id, data);

    return NextResponse.json({ success: true, blog });
  } catch (error) {
    return handleError(error);
  }
}
