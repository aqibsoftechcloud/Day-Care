import { NextRequest } from "next/server";
import { reorderHospitalSectionsHandler } from "@/controllers/hospital-section.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return reorderHospitalSectionsHandler(request, resolvedParams);
}
