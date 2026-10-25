import { NextRequest } from "next/server";
import {
  getContactPageSettingsHandler,
  updateContactPageSettingsHandler,
} from "@/controllers/contact-page-settings.controller";

export async function GET() {
  return getContactPageSettingsHandler();
}

export async function PUT(request: NextRequest) {
  return updateContactPageSettingsHandler(request);
}
