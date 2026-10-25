import { NextRequest } from "next/server";
import {
  createHospitalSectionHandler,
  listHospitalSectionsHandler,
} from "@/controllers/hospital-section.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return listHospitalSectionsHandler(resolvedParams);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return createHospitalSectionHandler(request, resolvedParams);
}
