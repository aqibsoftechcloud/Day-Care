import { NextRequest } from "next/server";
import { getWebsiteThemeHandler, updateWebsiteThemeHandler } from "@/controllers/website-theme.controller";

export async function GET() {
  return getWebsiteThemeHandler();
}

export async function PUT(request: NextRequest) {
  return updateWebsiteThemeHandler(request);
}
