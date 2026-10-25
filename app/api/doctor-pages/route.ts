import { NextRequest } from "next/server";
import {
  createDoctorPageHandler,
  listDoctorPages,
} from "@/controllers/doctor-page.controller";

export async function GET() {
  return listDoctorPages();
}

export async function POST(request: NextRequest) {
  return createDoctorPageHandler(request);
}
