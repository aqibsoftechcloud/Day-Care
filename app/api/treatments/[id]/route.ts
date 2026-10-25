import { NextRequest } from "next/server";
import {
  deleteTreatmentHandler,
  getTreatmentHandler,
  updateTreatmentHandler,
} from "@/controllers/treatment.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getTreatmentHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateTreatmentHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteTreatmentHandler(resolvedParams);
}
