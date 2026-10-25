import { NextRequest } from "next/server";
import {
  getGlobalSpecialityNavigationHandler,
  setGlobalSpecialityNavigationHandler,
} from "@/controllers/global-speciality.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getGlobalSpecialityNavigationHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return setGlobalSpecialityNavigationHandler(request, resolvedParams);
}
