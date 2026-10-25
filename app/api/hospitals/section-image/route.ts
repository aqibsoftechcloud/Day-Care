import { NextRequest } from "next/server";
import { uploadHospitalSectionImageHandler } from "@/controllers/hospital-section.controller";

export async function POST(request: NextRequest) {
  return uploadHospitalSectionImageHandler(request);
}
