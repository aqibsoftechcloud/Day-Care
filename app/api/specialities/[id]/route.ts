import { NextRequest } from "next/server";
import {
  deleteSpecialityHandler,
  getSpecialityHandler,
  updateSpecialityHandler,
} from "@/controllers/speciality.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getSpecialityHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateSpecialityHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteSpecialityHandler(resolvedParams);
}
