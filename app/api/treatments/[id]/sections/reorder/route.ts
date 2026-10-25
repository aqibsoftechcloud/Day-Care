import { NextRequest } from "next/server";
import { reorderTreatmentSectionsHandler } from "@/controllers/treatment-section.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return reorderTreatmentSectionsHandler(request, resolvedParams);
}
