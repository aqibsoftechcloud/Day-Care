import { NextRequest } from "next/server";
import {
  deleteGlobalTreatmentSectionHandler,
  updateGlobalTreatmentSectionHandler,
} from "@/controllers/global-treatment-section.controller";

type RouteParams = { params: Promise<{ id: string; sectionId: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateGlobalTreatmentSectionHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteGlobalTreatmentSectionHandler(resolvedParams);
}
