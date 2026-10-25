import { NextRequest } from "next/server";
import {
  deleteHospitalFaqHandler,
  getHospitalFaqHandler,
  updateHospitalFaqHandler,
} from "@/controllers/hospital-faq.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getHospitalFaqHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateHospitalFaqHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteHospitalFaqHandler(resolvedParams);
}
