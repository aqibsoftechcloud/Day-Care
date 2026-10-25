import { NextRequest } from "next/server";
import {
  deleteLocationHandler,
  getLocationHandler,
  updateLocationHandler,
} from "@/controllers/location.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getLocationHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateLocationHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteLocationHandler(resolvedParams);
}
