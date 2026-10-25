import { NextRequest } from "next/server";
import {
  getGlobalHomepageIconsHandler,
  updateGlobalHomepageIconsHandler,
} from "@/controllers/homepage-icon-settings.controller";

export async function GET() {
  return getGlobalHomepageIconsHandler();
}

export async function PUT(request: NextRequest) {
  return updateGlobalHomepageIconsHandler(request);
}
