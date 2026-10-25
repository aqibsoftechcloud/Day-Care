import { NextRequest } from "next/server";
import {
  deletePermissionHandler,
  getPermissionHandler,
  updatePermissionHandler,
} from "@/controllers/permission.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getPermissionHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updatePermissionHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deletePermissionHandler(resolvedParams);
}
