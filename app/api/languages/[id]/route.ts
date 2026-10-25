import { NextRequest } from "next/server";
import {
  deleteLanguageHandler,
  getLanguageHandler,
  updateLanguageHandler,
} from "@/controllers/language.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getLanguageHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateLanguageHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteLanguageHandler(resolvedParams);
}
