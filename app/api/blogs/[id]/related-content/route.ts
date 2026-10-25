import { NextRequest } from "next/server";
import { setBlogRelatedContentHandler } from "@/controllers/blog.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return setBlogRelatedContentHandler(request, resolvedParams);
}
