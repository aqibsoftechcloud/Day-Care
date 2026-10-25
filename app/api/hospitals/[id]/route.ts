import { NextRequest } from "next/server";
import {
  deleteHospitalHandler,
  getHospitalHandler,
  updateHospitalHandler,
} from "@/controllers/hospital.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getHospitalHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateHospitalHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteHospitalHandler(resolvedParams);
}
