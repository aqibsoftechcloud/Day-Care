import { NextRequest } from "next/server";
import { uploadGlobalTreatmentSectionImageHandler } from "@/controllers/global-treatment-section.controller";

export async function POST(request: NextRequest) {
  return uploadGlobalTreatmentSectionImageHandler(request);
}
