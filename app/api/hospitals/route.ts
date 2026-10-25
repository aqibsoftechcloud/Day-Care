import { NextRequest } from "next/server";
import {
  createHospitalHandler,
  listHospitals,
} from "@/controllers/hospital.controller";

export async function GET(request: NextRequest) {
  return listHospitals(request);
}

export async function POST(request: NextRequest) {
  return createHospitalHandler(request);
}
