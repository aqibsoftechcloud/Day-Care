import { NextRequest } from "next/server";
import { uploadPageSectionImageHandler } from "@/controllers/page-section.controller";

export async function POST(request: NextRequest) {
  return uploadPageSectionImageHandler(request);
}
