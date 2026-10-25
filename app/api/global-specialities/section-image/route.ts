import { NextRequest } from "next/server";
import { uploadGlobalSpecialitySectionImageHandler } from "@/controllers/global-speciality-section.controller";

export async function POST(request: NextRequest) {
  return uploadGlobalSpecialitySectionImageHandler(request);
}
