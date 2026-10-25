import { NextRequest } from "next/server";
import {
  createDoctorAwardHandler,
  listDoctorAwardsHandler,
} from "@/controllers/doctor-award.controller";

export async function GET(request: NextRequest) {
  return listDoctorAwardsHandler(request);
}

export async function POST(request: NextRequest) {
  return createDoctorAwardHandler(request);
}
