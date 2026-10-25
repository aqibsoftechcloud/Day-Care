import { NextRequest } from "next/server";
import {
  getRolePermissionsHandler,
  syncRolePermissionsHandler,
} from "@/controllers/role-permission.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getRolePermissionsHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return syncRolePermissionsHandler(request, resolvedParams);
}
