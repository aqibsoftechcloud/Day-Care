import { NextRequest } from "next/server";
import { uploadTreatmentSectionImageHandler } from "@/controllers/treatment-section.controller";

export async function POST(request: NextRequest) {
  return uploadTreatmentSectionImageHandler(request);
}
