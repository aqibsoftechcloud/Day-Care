import { prisma } from "@/lib/prisma";
import { sanitizeOptionalHtml } from "@/lib/sanitize-html.server";
import { Prisma } from "@/app/generated/prisma/client";
import { storageProvider } from "@/lib/storage";
import type {
  CreateBlogInput,
  ListBlogsQuery,
  SetBlogRelatedContentInput,
  UpdateBlogInput,
} from "@/validators/blog.validator";

export class BlogNotFoundError extends Error {
  constructor(id: number) {
    super(`Blog with id ${id} not found`);
    this.name = "BlogNotFoundError";
  }
}

export class BlogCategoryNotFoundError extends Error {
  constructor(blogCategoryId: number) {
    super(`Blog category with id ${blogCategoryId} not found`);
    this.name = "BlogCategoryNotFoundError";
  }
}

export class LanguageNotFoundError extends Error {
  constructor(languageId: number) {
    super(`Language with id ${languageId} not found`);
    this.name = "LanguageNotFoundError";
  }
}

export class CityNotFoundError extends Error {
  constructor(cityId: number) {
    super(`City with id ${cityId} not found`);
    this.name = "CityNotFoundError";
  }
}

export class GlobalSpecialityNotFoundError extends Error {
  constructor(ids: number[]) {
    super(`Global speciality id(s) not found: ${ids.join(", ")}`);
    this.name = "GlobalSpecialityNotFoundError";
  }
}

export class GlobalTreatmentNotFoundError extends Error {
  constructor(ids: number[]) {
    super(`Global treatment id(s) not found: ${ids.join(", ")}`);
    this.name = "GlobalTreatmentNotFoundError";
  }
}

export type BlogImageInput = { buffer: Buffer; mimeType: string };

const BLOG_UPLOAD_FOLDER = "blogs";
const BLOG_AUTHOR_UPLOAD_FOLDER = "blog-authors";

const blogSelect = {
  id: true,
  blog_category_id: true,
  blog_title: true,
  meta_title: true,
  meta_description: true,
  meta_keywords: true,
  seo_url: true,
  language_id: true,
  city_id: true,
  blog_image: true,
  published_date: true,
  search_keywords_for_doctors: true,
  blog_status: true,
  ai_content_generator: true,
  blog_text: true,
  author_name: true,
  author_image: true,
  is_featured: true,
  created_at: true,
  updated_at: true,
  blog_categories: { select: { id: true, category_name: true, seo_url: true } },
  languages: { select: { id: true, name: true, seo_url: true } },
  cities: { select: { id: true, city_name: true, seo_url: true } },
  // Related Reading associations — the sole source of truth for which
  // global specialities/treatments this blog is relevant to (see
  // blog_global_speciality_mappings/blog_global_treatment_mappings'
  // own doc comments). Flattened to plain id arrays in toSafeBlog.
  blog_global_speciality_mappings: { select: { global_speciality_id: true } },
  blog_global_treatment_mappings: { select: { global_treatment_id: true } },
} as const;

type BlogRecord = {
  id: number;
  blog_category_id: number;
  blog_title: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  seo_url: string;
  language_id: number;
  city_id: number | null;
  blog_image: string | null;
  published_date: Date | null;
  search_keywords_for_doctors: string | null;
  blog_status: string;
  ai_content_generator: boolean;
  blog_text: string | null;
  author_name: string | null;
  author_image: string | null;
  is_featured: boolean;
  created_at: Date;
  updated_at: Date;
  blog_categories: { id: number; category_name: string; seo_url: string };
  languages: { id: number; name: string; seo_url: string };
  cities: { id: number; city_name: string; seo_url: string } | null;
  blog_global_speciality_mappings: { global_speciality_id: number }[];
  blog_global_treatment_mappings: { global_treatment_id: number }[];
};

function toSafeBlog(blog: BlogRecord) {
  const { blog_categories, languages, cities, blog_global_speciality_mappings, blog_global_treatment_mappings, ...rest } =
    blog;

  return {
    ...rest,
    // Derived from the stored city_id (NULL = global) - never stored separately, so it cannot drift.
    scope: rest.city_id === null ? ("global" as const) : ("city" as const),
    category: blog_categories,
    language: languages,
    city: cities,
    related_global_speciality_ids: blog_global_speciality_mappings.map((m) => m.global_speciality_id),
    related_global_treatment_ids: blog_global_treatment_mappings.map((m) => m.global_treatment_id),
  };
}

async function ensureBlogCategoryExists(blogCategoryId: number) {
  const blogCategory = await prisma.blog_categories.findUnique({
    where: { id: blogCategoryId },
  });

  if (!blogCategory) {
    throw new BlogCategoryNotFoundError(blogCategoryId);
  }
}

async function ensureLanguageExists(languageId: number) {
  const language = await prisma.languages.findUnique({
    where: { id: languageId },
  });

  if (!language) {
    throw new LanguageNotFoundError(languageId);
  }
}

/** A city blog would end up with no city to attach to. */
export class BlogCityRequiredError extends Error {
  constructor() {
    super("City is required for a city-specific blog");
    this.name = "BlogCityRequiredError";
  }
}

async function ensureCityExists(cityId: number) {
  const city = await prisma.cities.findUnique({ where: { id: cityId } });

  if (!city) {
    throw new CityNotFoundError(cityId);
  }
}

/**
 * A blog's EFFECTIVE Related Reading target for a given type (speciality
 * or treatment) is its own explicit mapping if it has one — in which
 * case the category's mappings for that SAME type are irrelevant, never
 * merged in — otherwise the blog's category's mapping for that type, if
 * any. Each type (speciality/treatment) resolves independently: a blog
 * with an explicit speciality but no explicit treatment still falls back
 * to its category for treatments only. A category with no mapping at all
 * contributes nothing — its blogs simply don't match that filter, never
 * a blanket "every blog in this category matches every page" leak.
 */
function relatedTargetCondition(
  targetField: "global_speciality_id" | "global_treatment_id",
  id: number
): Prisma.blogsWhereInput {
  if (targetField === "global_speciality_id") {
    return {
      OR: [
        { blog_global_speciality_mappings: { some: { global_speciality_id: id } } },
        {
          blog_global_speciality_mappings: { none: {} },
          blog_categories: { blog_category_global_speciality_mappings: { some: { global_speciality_id: id } } },
        },
      ],
    };
  }

  return {
    OR: [
      { blog_global_treatment_mappings: { some: { global_treatment_id: id } } },
      {
        blog_global_treatment_mappings: { none: {} },
        blog_categories: { blog_category_global_treatment_mappings: { some: { global_treatment_id: id } } },
      },
    ],
  };
}

export async function getBlogs(filter?: ListBlogsQuery) {
  const andConditions: Prisma.blogsWhereInput[] = [];

  if (filter?.related_global_speciality_id !== undefined) {
    andConditions.push(relatedTargetCondition("global_speciality_id", filter.related_global_speciality_id));
  }

  if (filter?.related_global_treatment_id !== undefined) {
    andConditions.push(relatedTargetCondition("global_treatment_id", filter.related_global_treatment_id));
  }

  const blogs = await prisma.blogs.findMany({
    where: {
      ...(filter?.blog_category_id !== undefined
        ? { blog_category_id: filter.blog_category_id }
        : {}),
      ...(filter?.language_id !== undefined
        ? { language_id: filter.language_id }
        : {}),
      ...(filter?.city_id !== undefined ? { city_id: filter.city_id } : {}),
      ...(filter?.scope === "global" ? { city_id: null } : {}),
      ...(filter?.scope === "city" ? { city_id: { not: null } } : {}),
      ...(filter?.blog_status !== undefined
        ? { blog_status: filter.blog_status }
        : {}),
      ...(andConditions.length > 0 ? { AND: andConditions } : {}),
    },
    select: blogSelect,
    orderBy: [{ published_date: "desc" }, { id: "desc" }],
  });

  return blogs.map(toSafeBlog);
}

/**
 * Database-level `skip`/`take` pagination — distinct from `getBlogs`
 * (which loads every matching row, same as the admin table's own
 * client-side-filtered convention) since the public Blog Listing page
 * needs a real page of rows plus a total count, not the full dataset.
 * `excludeId` lets the Listing resolver drop the already-shown featured
 * blog out of the regular grid without a second round trip.
 */
export async function getBlogsPage(options: {
  page: number;
  pageSize: number;
  excludeId?: number;
}) {
  const where = {
    blog_status: "active" as const,
    ...(options.excludeId !== undefined ? { id: { not: options.excludeId } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.blogs.findMany({
      where,
      select: blogSelect,
      orderBy: [{ published_date: "desc" }, { id: "desc" }],
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.blogs.count({ where }),
  ]);

  return { items: rows.map(toSafeBlog), total };
}

/**
 * The single active blog to feature on the Listing page, or `null` when
 * none is marked — never a fabricated/promoted stand-in. Ties (more than
 * one `is_featured` blog) break by `published_date desc` — no separate
 * featured-ranking system, same ordering every other Blog query already
 * uses.
 */
export async function getFeaturedBlog() {
  const blog = await prisma.blogs.findFirst({
    where: { blog_status: "active", is_featured: true },
    select: blogSelect,
    orderBy: [{ published_date: "desc" }, { id: "desc" }],
  });

  return blog ? toSafeBlog(blog) : null;
}

export async function getBlogById(id: number) {
  const blog = await prisma.blogs.findUnique({
    where: { id },
    select: blogSelect,
  });

  if (!blog) {
    throw new BlogNotFoundError(id);
  }

  return toSafeBlog(blog);
}

/**
 * Public lookup by `seo_url` — returns the active blog, or `null` if no
 * active blog has this seo_url (never throws). Note the status column
 * here is `blog_status`, not `status`.
 */
export async function getBlogBySeoUrl(seoUrl: string) {
  const blog = await prisma.blogs.findFirst({
    where: { seo_url: seoUrl, blog_status: "active" },
    select: blogSelect,
  });

  return blog ? toSafeBlog(blog) : null;
}

export async function createBlog(
  input: CreateBlogInput,
  image?: BlogImageInput,
  authorImage?: BlogImageInput
) {
  const data = { ...input, blog_text: sanitizeOptionalHtml(input.blog_text) };
  await ensureBlogCategoryExists(data.blog_category_id);
  await ensureLanguageExists(data.language_id);
  const { scope, ...fields } = data;
  // Global blogs are stored with city_id NULL; a city blog's city was already required by the validator.
  const cityId = scope === "global" ? null : fields.city_id ?? null;

  if (scope === "city" && cityId === null) {
    throw new BlogCityRequiredError();
  }

  if (cityId !== null) {
    await ensureCityExists(cityId);
  }

  const imagePath = image
    ? await storageProvider.upload(image, BLOG_UPLOAD_FOLDER)
    : null;
  const authorImagePath = authorImage
    ? await storageProvider.upload(authorImage, BLOG_AUTHOR_UPLOAD_FOLDER)
    : null;

  const blog = await prisma.blogs.create({
    data: { ...fields, city_id: cityId, blog_image: imagePath, author_image: authorImagePath },
    select: blogSelect,
  });

  return toSafeBlog(blog);
}

/**
 * Update ordering for image replacement (safer than naive "delete old,
 * then write new"): a new image is uploaded first, then the DB is
 * updated; the OLD image is only deleted once that DB update has
 * succeeded (best-effort). If the DB update fails, the newly uploaded
 * file is best-effort cleaned up instead.
 *
 * The `image` parameter has three distinct states:
 * - `undefined`: no change — the existing image is preserved.
 * - `null`: an explicit clear — the DB field is set to NULL, and the old
 *   file is deleted (best-effort) only after that update succeeds.
 * - a real file: replace — upload, update, then delete the old file.
 */
export async function updateBlog(
  id: number,
  input: UpdateBlogInput,
  image?: BlogImageInput | null,
  authorImage?: BlogImageInput | null
) {
  const data = { ...input, ...(input.blog_text !== undefined ? { blog_text: sanitizeOptionalHtml(input.blog_text) } : {}) };
  const current = await prisma.blogs.findUnique({ where: { id } });

  if (!current) {
    throw new BlogNotFoundError(id);
  }

  if (data.blog_category_id !== undefined) {
    await ensureBlogCategoryExists(data.blog_category_id);
  }

  if (data.language_id !== undefined) {
    await ensureLanguageExists(data.language_id);
  }

  const { scope, ...fields } = data;

  // Scope only ever changes when the caller says so explicitly (an existing city blog is never silently
  // turned global). Omitted scope: a supplied city_id implies "city", otherwise the stored scope is kept.
  const targetScope = scope ?? (fields.city_id !== undefined ? "city" : current.city_id === null ? "global" : "city");
  const effectiveCityId = targetScope === "global" ? null : fields.city_id ?? current.city_id;

  if (targetScope === "city" && effectiveCityId === null) {
    throw new BlogCityRequiredError();
  }

  if (effectiveCityId !== null && effectiveCityId !== current.city_id) {
    await ensureCityExists(effectiveCityId);
  }

  let newImagePath: string | null | undefined;

  if (image === null) {
    newImagePath = null;
  } else if (image) {
    newImagePath = await storageProvider.upload(image, BLOG_UPLOAD_FOLDER);
  }

  let newAuthorImagePath: string | null | undefined;

  if (authorImage === null) {
    newAuthorImagePath = null;
  } else if (authorImage) {
    newAuthorImagePath = await storageProvider.upload(authorImage, BLOG_AUTHOR_UPLOAD_FOLDER);
  }

  try {
    const blog = await prisma.blogs.update({
      where: { id },
      data: {
        ...fields,
        city_id: effectiveCityId,
        ...(newImagePath !== undefined ? { blog_image: newImagePath } : {}),
        ...(newAuthorImagePath !== undefined ? { author_image: newAuthorImagePath } : {}),
        updated_at: new Date(),
      },
      select: blogSelect,
    });

    if (newImagePath !== undefined && current.blog_image) {
      await storageProvider
        .delete(current.blog_image)
        .catch((error) =>
          console.error("Failed to delete old blog image:", error)
        );
    }

    if (newAuthorImagePath !== undefined && current.author_image) {
      await storageProvider
        .delete(current.author_image)
        .catch((error) =>
          console.error("Failed to delete old blog author image:", error)
        );
    }

    return toSafeBlog(blog);
  } catch (error) {
    if (newImagePath) {
      await storageProvider
        .delete(newImagePath)
        .catch((cleanupError) =>
          console.error(
            "Failed to clean up newly uploaded blog image after a failed update:",
            cleanupError
          )
        );
    }

    if (newAuthorImagePath) {
      await storageProvider
        .delete(newAuthorImagePath)
        .catch((cleanupError) =>
          console.error(
            "Failed to clean up newly uploaded blog author image after a failed update:",
            cleanupError
          )
        );
    }

    throw error;
  }
}

/**
 * Soft delete: deactivates the blog by setting blog_status to "inactive".
 * The blog_image and all blog_faqs are preserved — a soft delete does not
 * automatically deactivate the blog's FAQs.
 */
export async function deleteBlog(id: number) {
  const current = await prisma.blogs.findUnique({ where: { id } });

  if (!current) {
    throw new BlogNotFoundError(id);
  }

  await prisma.blogs.update({
    where: { id },
    data: { blog_status: "inactive", updated_at: new Date() },
  });
}

/** Also used by services/blog-category.service.ts's createBlogCategory/updateBlogCategory — same validation, same error classes, not duplicated. */
export async function ensureGlobalSpecialitiesExist(ids: number[]) {
  if (ids.length === 0) return;

  const found = await prisma.global_specialities.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  const foundIds = new Set(found.map((row) => row.id));
  const missing = ids.filter((id) => !foundIds.has(id));

  if (missing.length > 0) {
    throw new GlobalSpecialityNotFoundError(missing);
  }
}

/** Also used by services/blog-category.service.ts — see ensureGlobalSpecialitiesExist's own comment. */
export async function ensureGlobalTreatmentsExist(ids: number[]) {
  if (ids.length === 0) return;

  const found = await prisma.global_treatments.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  const foundIds = new Set(found.map((row) => row.id));
  const missing = ids.filter((id) => !foundIds.has(id));

  if (missing.length > 0) {
    throw new GlobalTreatmentNotFoundError(missing);
  }
}

/**
 * The Blog form's Related Content save step — replaces this blog's FULL
 * set of global-speciality/global-treatment associations in one
 * transaction (delete-all-then-recreate, same shape as every other
 * many-to-many "resubmit the current full list" sync in this codebase,
 * e.g. doctor_speciality_mappings via DoctorFormDialog). Both the
 * deletes and the inserts for both relations happen atomically — a
 * failure partway through leaves the previous associations untouched
 * rather than a half-applied set.
 */
export async function setBlogRelatedContent(blogId: number, input: SetBlogRelatedContentInput) {
  const blog = await prisma.blogs.findUnique({ where: { id: blogId }, select: { id: true } });

  if (!blog) {
    throw new BlogNotFoundError(blogId);
  }

  await ensureGlobalSpecialitiesExist(input.global_speciality_ids);
  await ensureGlobalTreatmentsExist(input.global_treatment_ids);

  await prisma.$transaction([
    prisma.blog_global_speciality_mappings.deleteMany({ where: { blog_id: blogId } }),
    prisma.blog_global_treatment_mappings.deleteMany({ where: { blog_id: blogId } }),
    ...(input.global_speciality_ids.length > 0
      ? [
          prisma.blog_global_speciality_mappings.createMany({
            data: input.global_speciality_ids.map((global_speciality_id) => ({ blog_id: blogId, global_speciality_id })),
          }),
        ]
      : []),
    ...(input.global_treatment_ids.length > 0
      ? [
          prisma.blog_global_treatment_mappings.createMany({
            data: input.global_treatment_ids.map((global_treatment_id) => ({ blog_id: blogId, global_treatment_id })),
          }),
        ]
      : []),
  ]);

  return getBlogById(blogId);
}
