import { NextRequest } from "next/server";
import {
  getDoctorSpecialitiesHandler,
  syncDoctorSpecialitiesHandler,
} from "@/controllers/doctor-mapping.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getDoctorSpecialitiesHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return syncDoctorSpecialitiesHandler(request, resolvedParams);
}
