import { NextRequest } from "next/server";
import {
  deleteSpecialityFaqHandler,
  getSpecialityFaqHandler,
  updateSpecialityFaqHandler,
} from "@/controllers/speciality-faq.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getSpecialityFaqHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateSpecialityFaqHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteSpecialityFaqHandler(resolvedParams);
}
