import { NextRequest } from "next/server";
import {
  createGlobalSpecialitySectionHandler,
  listGlobalSpecialitySectionsHandler,
} from "@/controllers/global-speciality-section.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return listGlobalSpecialitySectionsHandler(resolvedParams);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return createGlobalSpecialitySectionHandler(request, resolvedParams);
}
