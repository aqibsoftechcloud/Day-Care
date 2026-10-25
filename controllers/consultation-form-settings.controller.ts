import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requirePermission, tryHandleAuthorizationError } from "@/lib/auth/authorization";
import { updateConsultationFormSettingsSchema } from "@/validators/consultation-form-settings.validator";
import { getConsultationFormSettings, updateConsultationFormSettings } from "@/services/consultation-form-settings.service";

function handleError(error: unknown) {
  const authResponse = tryHandleAuthorizationError(error);
  if (authResponse) {
    return authResponse;
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, message: "Validation failed", errors: error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  console.error(error);

  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

export async function getConsultationFormSettingsHandler() {
  try {
    await requirePermission("consultation-form-settings", "view");
    const settings = await getConsultationFormSettings();

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateConsultationFormSettingsHandler(request: NextRequest) {
  try {
    await requirePermission("consultation-form-settings", "update");
    const body = await request.json();
    const data = updateConsultationFormSettingsSchema.parse(body);
    const settings = await updateConsultationFormSettings(data);

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return handleError(error);
  }
}
