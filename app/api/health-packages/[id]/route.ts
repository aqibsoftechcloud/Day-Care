import { NextRequest } from "next/server";
import {
  deleteHealthPackageHandler,
  getHealthPackageHandler,
  updateHealthPackageHandler,
} from "@/controllers/health-package.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getHealthPackageHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateHealthPackageHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteHealthPackageHandler(resolvedParams);
}
