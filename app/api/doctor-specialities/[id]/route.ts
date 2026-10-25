import { NextRequest } from "next/server";
import {
  deleteDoctorSpecialityHandler,
  getDoctorSpecialityHandler,
  updateDoctorSpecialityHandler,
} from "@/controllers/doctor-speciality.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getDoctorSpecialityHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateDoctorSpecialityHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteDoctorSpecialityHandler(resolvedParams);
}
