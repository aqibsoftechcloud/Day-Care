import { NextRequest } from "next/server";
import {
  createDoctorSpecialityHandler,
  listDoctorSpecialitiesHandler,
} from "@/controllers/doctor-speciality.controller";

export async function GET(request: NextRequest) {
  return listDoctorSpecialitiesHandler(request);
}

export async function POST(request: NextRequest) {
  return createDoctorSpecialityHandler(request);
}
