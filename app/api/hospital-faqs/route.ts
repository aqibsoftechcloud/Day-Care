import { NextRequest } from "next/server";
import {
  createHospitalFaqHandler,
  listHospitalFaqsHandler,
} from "@/controllers/hospital-faq.controller";

export async function GET(request: NextRequest) {
  return listHospitalFaqsHandler(request);
}

export async function POST(request: NextRequest) {
  return createHospitalFaqHandler(request);
}
