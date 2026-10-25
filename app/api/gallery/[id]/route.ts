import { NextRequest } from "next/server";
import {
  deleteGalleryHandler,
  getGalleryHandler,
  updateGalleryHandler,
} from "@/controllers/gallery.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getGalleryHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateGalleryHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteGalleryHandler(resolvedParams);
}
