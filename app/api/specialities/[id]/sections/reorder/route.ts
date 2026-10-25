import { NextRequest } from "next/server";
import { reorderSpecialitySectionsHandler } from "@/controllers/speciality-section.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return reorderSpecialitySectionsHandler(request, resolvedParams);
}
