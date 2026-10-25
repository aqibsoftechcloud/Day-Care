import { NextRequest } from "next/server";
import {
  deleteAppointmentLeadHandler,
  getAppointmentLeadHandler,
  updateAppointmentLeadHandler,
} from "@/controllers/appointment-lead.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getAppointmentLeadHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateAppointmentLeadHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteAppointmentLeadHandler(resolvedParams);
}
