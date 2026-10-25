import { NextRequest } from "next/server";
import {
  deleteRoleHandler,
  getRoleHandler,
  updateRoleHandler,
} from "@/controllers/role.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getRoleHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateRoleHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteRoleHandler(resolvedParams);
}
