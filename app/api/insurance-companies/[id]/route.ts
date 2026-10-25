import { NextRequest } from "next/server";
import {
  deleteInsuranceCompanyHandler,
  getInsuranceCompanyHandler,
  updateInsuranceCompanyHandler,
} from "@/controllers/insurance-company.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getInsuranceCompanyHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateInsuranceCompanyHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteInsuranceCompanyHandler(resolvedParams);
}
