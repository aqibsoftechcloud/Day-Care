import { prisma } from "@/lib/prisma";
import { ensureGlobalSpecialitiesExist, ensureGlobalTreatmentsExist } from "@/services/blog.service";
import type {
  CreateBlogCategoryInput,
  ListBlogCategoriesQuery,
  UpdateBlogCategoryInput,
} from "@/validators/blog-category.validator";

export class BlogCategoryNotFoundError extends Error {
  constructor(id: number) {
    super(`Blog category with id ${id} not found`);
    this.name = "BlogCategoryNotFoundError";
  }
}

export class BlogCategoryHasActiveBlogsError extends Error {
  constructor(id: number) {
    super(
      `Blog category with id ${id} has active blogs and cannot be deactivated until they are reassigned or deactivated first`
    );
    this.name = "BlogCategoryHasActiveBlogsError";
  }
}

const blogCategorySelect = {
  id: true,
  category_name: true,
  meta_title: true,
  meta_description: true,
  meta_keywords: true,
  seo_url: true,
  status: true,
  created_at: true,
  updated_at: true,
  // Default Related Reading associations for every blog in this
  // category — see blog_category_global_speciality_mappings' own doc
  // comment. Flattened to plain id arrays in toSafeBlogCategory.
  blog_category_global_speciality_mappings: { select: { global_speciality_id: true } },
  blog_category_global_treatment_mappings: { select: { global_treatment_id: true } },
} as const;

type BlogCategoryRecord = {
  id: number;
  category_name: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  seo_url: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  blog_category_global_speciality_mappings: { global_speciality_id: number }[];
  blog_category_global_treatment_mappings: { global_treatment_id: number }[];
};

function toSafeBlogCategory(blogCategory: BlogCategoryRecord) {
  const { blog_category_global_speciality_mappings, blog_category_global_treatment_mappings, ...rest } = blogCategory;

  return {
    ...rest,
    related_global_speciality_ids: blog_category_global_speciality_mappings.map((m) => m.global_speciality_id),
    related_global_treatment_ids: blog_category_global_treatment_mappings.map((m) => m.global_treatment_id),
  };
}

async function ensureNoActiveBlogs(id: number) {
  const activeBlog = await prisma.blogs.findFirst({
    where: { blog_category_id: id, blog_status: "active" },
    select: { id: true },
  });

  if (activeBlog) {
    throw new BlogCategoryHasActiveBlogsError(id);
  }
}

export async function getBlogCategories(filter?: ListBlogCategoriesQuery) {
  const rows = await prisma.blog_categories.findMany({
    where: {
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: blogCategorySelect,
    orderBy: { id: "asc" },
  });

  return rows.map(toSafeBlogCategory);
}

export async function getBlogCategoryById(id: number) {
  const blogCategory = await prisma.blog_categories.findUnique({
    where: { id },
    select: blogCategorySelect,
  });

  if (!blogCategory) {
    throw new BlogCategoryNotFoundError(id);
  }

  return toSafeBlogCategory(blogCategory);
}

/**
 * Public lookup by `seo_url` — returns the active blog category, or
 * `null` if none is active with this seo_url (never throws).
 */
export async function getBlogCategoryBySeoUrl(seoUrl: string) {
  const blogCategory = await prisma.blog_categories.findFirst({
    where: { seo_url: seoUrl, status: "active" },
    select: blogCategorySelect,
  });

  return blogCategory ? toSafeBlogCategory(blogCategory) : null;
}

/**
 * Creates the category AND its Related Reading default mappings in one
 * transaction — per the explicit requirement that saving a category must
 * not silently succeed if its mapping save fails (unlike the blog-level
 * feature, which persists associations via a second API call after the
 * core record already exists; a category has no file upload forcing that
 * split, so there's no reason not to make this fully atomic).
 */
export async function createBlogCategory(data: CreateBlogCategoryInput) {
  const { global_speciality_ids, global_treatment_ids, ...categoryData } = data;
  const specialityIds = global_speciality_ids ?? [];
  const treatmentIds = global_treatment_ids ?? [];

  await ensureGlobalSpecialitiesExist(specialityIds);
  await ensureGlobalTreatmentsExist(treatmentIds);

  return prisma.$transaction(async (tx) => {
    const created = await tx.blog_categories.create({ data: categoryData, select: { id: true } });

    if (specialityIds.length > 0) {
      await tx.blog_category_global_speciality_mappings.createMany({
        data: specialityIds.map((global_speciality_id) => ({ blog_category_id: created.id, global_speciality_id })),
      });
    }

    if (treatmentIds.length > 0) {
      await tx.blog_category_global_treatment_mappings.createMany({
        data: treatmentIds.map((global_treatment_id) => ({ blog_category_id: created.id, global_treatment_id })),
      });
    }

    const row = await tx.blog_categories.findUniqueOrThrow({ where: { id: created.id }, select: blogCategorySelect });
    return toSafeBlogCategory(row);
  });
}

/**
 * Updates the category and, when either mapping array is provided,
 * fully replaces that relation (omitting an array leaves its existing
 * mappings untouched — same "omit to leave unchanged" convention as
 * every other optional relation field in this codebase). Same
 * single-transaction atomicity guarantee as createBlogCategory.
 */
export async function updateBlogCategory(
  id: number,
  data: UpdateBlogCategoryInput
) {
  const current = await prisma.blog_categories.findUnique({ where: { id } });

  if (!current) {
    throw new BlogCategoryNotFoundError(id);
  }

  const { global_speciality_ids, global_treatment_ids, ...categoryData } = data;

  if (global_speciality_ids !== undefined) {
    await ensureGlobalSpecialitiesExist(global_speciality_ids);
  }
  if (global_treatment_ids !== undefined) {
    await ensureGlobalTreatmentsExist(global_treatment_ids);
  }

  return prisma.$transaction(async (tx) => {
    await tx.blog_categories.update({
      where: { id },
      data: { ...categoryData, updated_at: new Date() },
    });

    if (global_speciality_ids !== undefined) {
      await tx.blog_category_global_speciality_mappings.deleteMany({ where: { blog_category_id: id } });
      if (global_speciality_ids.length > 0) {
        await tx.blog_category_global_speciality_mappings.createMany({
          data: global_speciality_ids.map((global_speciality_id) => ({ blog_category_id: id, global_speciality_id })),
        });
      }
    }

    if (global_treatment_ids !== undefined) {
      await tx.blog_category_global_treatment_mappings.deleteMany({ where: { blog_category_id: id } });
      if (global_treatment_ids.length > 0) {
        await tx.blog_category_global_treatment_mappings.createMany({
          data: global_treatment_ids.map((global_treatment_id) => ({ blog_category_id: id, global_treatment_id })),
        });
      }
    }

    const row = await tx.blog_categories.findUniqueOrThrow({ where: { id }, select: blogCategorySelect });
    return toSafeBlogCategory(row);
  });
}

/**
 * Soft delete: deactivates the blog category by setting status to
 * "inactive". Refuses to deactivate a category that still has active
 * blogs, to avoid silently orphaning them under an inactive category —
 * the caller must reassign or deactivate the blogs first.
 */
export async function deleteBlogCategory(id: number) {
  const current = await prisma.blog_categories.findUnique({ where: { id } });

  if (!current) {
    throw new BlogCategoryNotFoundError(id);
  }

  await ensureNoActiveBlogs(id);

  await prisma.blog_categories.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
