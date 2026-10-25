import { NextRequest } from "next/server";
import {
  deleteBookaformDataHandler,
  getBookaformDataHandler,
  updateBookaformDataHandler,
} from "@/controllers/bookaform.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getBookaformDataHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateBookaformDataHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteBookaformDataHandler(resolvedParams);
}
