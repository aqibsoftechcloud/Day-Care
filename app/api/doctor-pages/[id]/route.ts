import { NextRequest } from "next/server";
import {
  deleteDoctorPageHandler,
  getDoctorPageHandler,
  updateDoctorPageHandler,
} from "@/controllers/doctor-page.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getDoctorPageHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateDoctorPageHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteDoctorPageHandler(resolvedParams);
}
