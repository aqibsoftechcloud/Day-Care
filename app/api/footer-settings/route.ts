import { NextRequest } from "next/server";
import { getFooterSettingsHandler, updateFooterSettingsHandler } from "@/controllers/footer-settings.controller";

export async function GET() {
  return getFooterSettingsHandler();
}

export async function PUT(request: NextRequest) {
  return updateFooterSettingsHandler(request);
}
