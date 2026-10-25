import { NextRequest } from "next/server";
import {
  deleteGlobalSpecialityFaqHandler,
  getGlobalSpecialityFaqHandler,
  updateGlobalSpecialityFaqHandler,
} from "@/controllers/global-speciality-faq.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getGlobalSpecialityFaqHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateGlobalSpecialityFaqHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteGlobalSpecialityFaqHandler(resolvedParams);
}
