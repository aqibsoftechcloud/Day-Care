import { NextRequest } from "next/server";
import { reorderGlobalTreatmentSectionsHandler } from "@/controllers/global-treatment-section.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return reorderGlobalTreatmentSectionsHandler(request, resolvedParams);
}
