import { NextRequest } from "next/server";
import {
  createSpecialitySectionHandler,
  listSpecialitySectionsHandler,
} from "@/controllers/speciality-section.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return listSpecialitySectionsHandler(resolvedParams);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return createSpecialitySectionHandler(request, resolvedParams);
}
