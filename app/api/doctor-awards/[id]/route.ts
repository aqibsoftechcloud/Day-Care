import { NextRequest } from "next/server";
import {
  deleteDoctorAwardHandler,
  getDoctorAwardHandler,
  updateDoctorAwardHandler,
} from "@/controllers/doctor-award.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getDoctorAwardHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateDoctorAwardHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteDoctorAwardHandler(resolvedParams);
}
