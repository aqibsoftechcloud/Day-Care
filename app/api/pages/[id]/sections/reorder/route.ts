import { NextRequest } from "next/server";
import { reorderPageSectionsHandler } from "@/controllers/page-section.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return reorderPageSectionsHandler(request, resolvedParams);
}
