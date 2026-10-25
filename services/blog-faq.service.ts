import { prisma } from "@/lib/prisma";
import type {
  CreateBlogFaqInput,
  ListBlogFaqsQuery,
  UpdateBlogFaqInput,
} from "@/validators/blog-faq.validator";

export class BlogFaqNotFoundError extends Error {
  constructor(id: number) {
    super(`Blog FAQ with id ${id} not found`);
    this.name = "BlogFaqNotFoundError";
  }
}

export class BlogNotFoundError extends Error {
  constructor(blogId: number) {
    super(`Blog with id ${blogId} not found`);
    this.name = "BlogNotFoundError";
  }
}

const blogFaqSelect = {
  id: true,
  blog_id: true,
  title: true,
  text: true,
  sorting_order: true,
  status: true,
  created_at: true,
  updated_at: true,
  blogs: { select: { id: true, blog_title: true, seo_url: true } },
} as const;

type BlogFaqRecord = {
  id: number;
  blog_id: number;
  title: string;
  text: string;
  sorting_order: number;
  status: string;
  created_at: Date;
  updated_at: Date;
  blogs: { id: number; blog_title: string; seo_url: string };
};

function toSafeBlogFaq(faq: BlogFaqRecord) {
  const { blogs, ...rest } = faq;

  return { ...rest, blog: blogs };
}

async function ensureBlogExists(blogId: number) {
  const blog = await prisma.blogs.findUnique({ where: { id: blogId } });

  if (!blog) {
    throw new BlogNotFoundError(blogId);
  }
}

export async function getBlogFaqs(filter?: ListBlogFaqsQuery) {
  const faqs = await prisma.blog_faqs.findMany({
    where:
      filter?.blog_id !== undefined ? { blog_id: filter.blog_id } : undefined,
    select: blogFaqSelect,
    orderBy: [{ sorting_order: "asc" }, { id: "asc" }],
  });

  return faqs.map(toSafeBlogFaq);
}

export async function getBlogFaqById(id: number) {
  const faq = await prisma.blog_faqs.findUnique({
    where: { id },
    select: blogFaqSelect,
  });

  if (!faq) {
    throw new BlogFaqNotFoundError(id);
  }

  return toSafeBlogFaq(faq);
}

export async function createBlogFaq(data: CreateBlogFaqInput) {
  await ensureBlogExists(data.blog_id);

  const faq = await prisma.blog_faqs.create({
    data,
    select: blogFaqSelect,
  });

  return toSafeBlogFaq(faq);
}

export async function updateBlogFaq(id: number, data: UpdateBlogFaqInput) {
  const current = await prisma.blog_faqs.findUnique({ where: { id } });

  if (!current) {
    throw new BlogFaqNotFoundError(id);
  }

  if (data.blog_id !== undefined) {
    await ensureBlogExists(data.blog_id);
  }

  const faq = await prisma.blog_faqs.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
    select: blogFaqSelect,
  });

  return toSafeBlogFaq(faq);
}

/**
 * Soft delete: deactivates the FAQ by setting status to "inactive".
 */
export async function deleteBlogFaq(id: number) {
  const current = await prisma.blog_faqs.findUnique({ where: { id } });

  if (!current) {
    throw new BlogFaqNotFoundError(id);
  }

  await prisma.blog_faqs.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
