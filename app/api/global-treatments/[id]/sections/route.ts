import { NextRequest } from "next/server";
import {
  createGlobalTreatmentSectionHandler,
  listGlobalTreatmentSectionsHandler,
} from "@/controllers/global-treatment-section.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return listGlobalTreatmentSectionsHandler(resolvedParams);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return createGlobalTreatmentSectionHandler(request, resolvedParams);
}
