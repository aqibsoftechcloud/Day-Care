import { NextRequest } from "next/server";
import {
  deleteJsConfigurationHandler,
  getJsConfigurationHandler,
  updateJsConfigurationHandler,
} from "@/controllers/js-configuration.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getJsConfigurationHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateJsConfigurationHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteJsConfigurationHandler(resolvedParams);
}
