import { NextRequest } from "next/server";
import { listInternationalPatientLeadsHandler } from "@/controllers/international-patient-lead.controller";

export async function GET(request: NextRequest) {
  return listInternationalPatientLeadsHandler(request);
}
