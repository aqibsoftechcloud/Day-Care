import { NextRequest } from "next/server";
import {
  deleteBlogCategoryHandler,
  getBlogCategoryHandler,
  updateBlogCategoryHandler,
} from "@/controllers/blog-category.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getBlogCategoryHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateBlogCategoryHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteBlogCategoryHandler(resolvedParams);
}
