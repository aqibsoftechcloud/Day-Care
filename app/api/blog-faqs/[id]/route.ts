import { NextRequest } from "next/server";
import {
  deleteBlogFaqHandler,
  getBlogFaqHandler,
  updateBlogFaqHandler,
} from "@/controllers/blog-faq.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getBlogFaqHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateBlogFaqHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteBlogFaqHandler(resolvedParams);
}
