import { NextRequest } from "next/server";
import {
  deleteSymptomPartHandler,
  getSymptomPartHandler,
  updateSymptomPartHandler,
} from "@/controllers/symptom-part.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getSymptomPartHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateSymptomPartHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteSymptomPartHandler(resolvedParams);
}
