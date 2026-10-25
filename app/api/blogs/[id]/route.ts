import { NextRequest } from "next/server";
import {
  deleteBlogHandler,
  getBlogHandler,
  updateBlogHandler,
} from "@/controllers/blog.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getBlogHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateBlogHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteBlogHandler(resolvedParams);
}
