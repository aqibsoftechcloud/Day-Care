import { NextRequest } from "next/server";
import {
  addHospitalInsuranceCompanyHandler,
  listHospitalInsuranceCompaniesHandler,
  reorderHospitalInsuranceCompaniesHandler,
} from "@/controllers/hospital-insurance.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return listHospitalInsuranceCompaniesHandler({ hospitalId: id });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return addHospitalInsuranceCompanyHandler(request, { hospitalId: id });
}

/** Bulk reorder — the full ordered set of this hospital's insurance mappings. */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return reorderHospitalInsuranceCompaniesHandler(request, { hospitalId: id });
}
