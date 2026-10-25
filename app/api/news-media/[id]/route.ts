import { NextRequest } from "next/server";
import {
  deleteNewsMediaHandler,
  getNewsMediaHandler,
  updateNewsMediaHandler,
} from "@/controllers/news-media.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getNewsMediaHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateNewsMediaHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteNewsMediaHandler(resolvedParams);
}
