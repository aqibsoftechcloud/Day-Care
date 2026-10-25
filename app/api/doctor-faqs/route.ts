import { NextRequest } from "next/server";
import {
  createDoctorFaqHandler,
  listDoctorFaqsHandler,
} from "@/controllers/doctor-faq.controller";

export async function GET(request: NextRequest) {
  return listDoctorFaqsHandler(request);
}

export async function POST(request: NextRequest) {
  return createDoctorFaqHandler(request);
}
