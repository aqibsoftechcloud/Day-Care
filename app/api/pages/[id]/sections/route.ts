import { NextRequest } from "next/server";
import {
  createPageSectionHandler,
  listPageSectionsHandler,
} from "@/controllers/page-section.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return listPageSectionsHandler(resolvedParams);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return createPageSectionHandler(request, resolvedParams);
}
