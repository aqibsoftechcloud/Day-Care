import { NextRequest } from "next/server";
import {
  deleteTreatmentSymptomHandler,
  getTreatmentSymptomHandler,
  updateTreatmentSymptomHandler,
} from "@/controllers/treatment-symptom.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getTreatmentSymptomHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateTreatmentSymptomHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteTreatmentSymptomHandler(resolvedParams);
}
