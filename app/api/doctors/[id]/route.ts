import { NextRequest } from "next/server";
import {
  deleteDoctorHandler,
  getDoctorHandler,
  updateDoctorHandler,
} from "@/controllers/doctor.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getDoctorHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateDoctorHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteDoctorHandler(resolvedParams);
}
