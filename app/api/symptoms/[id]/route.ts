import { NextRequest } from "next/server";
import {
  deleteSymptomHandler,
  getSymptomHandler,
  updateSymptomHandler,
} from "@/controllers/symptom.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getSymptomHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateSymptomHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteSymptomHandler(resolvedParams);
}
