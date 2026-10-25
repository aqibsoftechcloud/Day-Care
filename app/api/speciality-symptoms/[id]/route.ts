import { NextRequest } from "next/server";
import {
  deleteSpecialitySymptomHandler,
  getSpecialitySymptomHandler,
  updateSpecialitySymptomHandler,
} from "@/controllers/speciality-symptom.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getSpecialitySymptomHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateSpecialitySymptomHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteSpecialitySymptomHandler(resolvedParams);
}
