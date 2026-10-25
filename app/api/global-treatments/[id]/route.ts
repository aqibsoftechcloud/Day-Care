import { NextRequest } from "next/server";
import {
  deleteGlobalTreatmentHandler,
  getGlobalTreatmentHandler,
  updateGlobalTreatmentHandler,
} from "@/controllers/global-treatment.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getGlobalTreatmentHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateGlobalTreatmentHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteGlobalTreatmentHandler(resolvedParams);
}
