import { NextRequest } from "next/server";
import {
  getDoctorHospitalsHandler,
  syncDoctorHospitalsHandler,
} from "@/controllers/doctor-mapping.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getDoctorHospitalsHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return syncDoctorHospitalsHandler(request, resolvedParams);
}
