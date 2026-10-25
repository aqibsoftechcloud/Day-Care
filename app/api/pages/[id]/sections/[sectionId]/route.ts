import { NextRequest } from "next/server";
import {
  deletePageSectionHandler,
  getPageSectionHandler,
  updatePageSectionHandler,
} from "@/controllers/page-section.controller";

type RouteParams = { params: Promise<{ id: string; sectionId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getPageSectionHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updatePageSectionHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deletePageSectionHandler(resolvedParams);
}
