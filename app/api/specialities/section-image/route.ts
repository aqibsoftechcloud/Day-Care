import { NextRequest } from "next/server";
import { uploadSpecialitySectionImageHandler } from "@/controllers/speciality-section.controller";

export async function POST(request: NextRequest) {
  return uploadSpecialitySectionImageHandler(request);
}
