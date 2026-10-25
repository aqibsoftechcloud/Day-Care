import { NextRequest } from "next/server";
import {
  deleteMenuHandler,
  getMenuHandler,
  updateMenuHandler,
} from "@/controllers/menu.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getMenuHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateMenuHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteMenuHandler(resolvedParams);
}
