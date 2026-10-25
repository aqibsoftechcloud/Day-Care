import { NextRequest } from "next/server";
import {
  deleteTreatmentSectionHandler,
  updateTreatmentSectionHandler,
} from "@/controllers/treatment-section.controller";

type RouteParams = { params: Promise<{ id: string; sectionId: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateTreatmentSectionHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteTreatmentSectionHandler(resolvedParams);
}
