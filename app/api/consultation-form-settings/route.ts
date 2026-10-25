import { NextRequest } from "next/server";
import {
  getConsultationFormSettingsHandler,
  updateConsultationFormSettingsHandler,
} from "@/controllers/consultation-form-settings.controller";

export async function GET() {
  return getConsultationFormSettingsHandler();
}

export async function PUT(request: NextRequest) {
  return updateConsultationFormSettingsHandler(request);
}
