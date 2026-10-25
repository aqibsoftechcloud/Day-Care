import { NextRequest } from "next/server";
import {
  deleteInternationalPatientLeadHandler,
  getInternationalPatientLeadHandler,
  updateInternationalPatientLeadHandler,
} from "@/controllers/international-patient-lead.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getInternationalPatientLeadHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateInternationalPatientLeadHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteInternationalPatientLeadHandler(resolvedParams);
}
