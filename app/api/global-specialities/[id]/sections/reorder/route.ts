import { NextRequest } from "next/server";
import { reorderGlobalSpecialitySectionsHandler } from "@/controllers/global-speciality-section.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return reorderGlobalSpecialitySectionsHandler(request, resolvedParams);
}
