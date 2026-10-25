import { NextRequest } from "next/server";
import {
  createDoctorHandler,
  listDoctorsHandler,
} from "@/controllers/doctor.controller";

export async function GET(request: NextRequest) {
  return listDoctorsHandler(request);
}

export async function POST(request: NextRequest) {
  return createDoctorHandler(request);
}
