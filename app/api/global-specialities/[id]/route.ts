import { NextRequest } from "next/server";
import {
  deleteGlobalSpecialityHandler,
  getGlobalSpecialityHandler,
  updateGlobalSpecialityHandler,
} from "@/controllers/global-speciality.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getGlobalSpecialityHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateGlobalSpecialityHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteGlobalSpecialityHandler(resolvedParams);
}
