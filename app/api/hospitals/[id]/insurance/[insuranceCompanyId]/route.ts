import { NextRequest } from "next/server";
import { removeHospitalInsuranceCompanyHandler } from "@/controllers/hospital-insurance.controller";

type RouteParams = { params: Promise<{ id: string; insuranceCompanyId: string }> };

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id, insuranceCompanyId } = await params;
  return removeHospitalInsuranceCompanyHandler({ hospitalId: id, insuranceCompanyId });
}
