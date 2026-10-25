import { NextRequest } from "next/server";
import {
  deleteModuleHandler,
  getModuleHandler,
  updateModuleHandler,
} from "@/controllers/module.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getModuleHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateModuleHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteModuleHandler(resolvedParams);
}
