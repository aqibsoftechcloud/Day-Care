import { NextRequest } from "next/server";
import {
  createInsuranceCompanyHandler,
  listInsuranceCompaniesHandler,
} from "@/controllers/insurance-company.controller";

export async function GET(request: NextRequest) {
  return listInsuranceCompaniesHandler(request);
}

export async function POST(request: NextRequest) {
  return createInsuranceCompanyHandler(request);
}
