import { NextRequest } from "next/server";
import {
  deleteDoctorFaqHandler,
  getDoctorFaqHandler,
  updateDoctorFaqHandler,
} from "@/controllers/doctor-faq.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getDoctorFaqHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateDoctorFaqHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteDoctorFaqHandler(resolvedParams);
}
