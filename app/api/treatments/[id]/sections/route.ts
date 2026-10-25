import { NextRequest } from "next/server";
import {
  createTreatmentSectionHandler,
  listTreatmentSectionsHandler,
} from "@/controllers/treatment-section.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return listTreatmentSectionsHandler(resolvedParams);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return createTreatmentSectionHandler(request, resolvedParams);
}
