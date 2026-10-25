import { NextRequest } from "next/server";
import { duplicatePageSectionHandler } from "@/controllers/page-section.controller";

type RouteParams = { params: Promise<{ id: string; sectionId: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return duplicatePageSectionHandler(resolvedParams);
}
