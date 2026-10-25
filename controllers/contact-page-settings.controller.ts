import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requirePermission, tryHandleAuthorizationError } from "@/lib/auth/authorization";
import { updateContactPageSettingsSchema } from "@/validators/contact-page-settings.validator";
import { getContactPageSettings, updateContactPageSettings } from "@/services/contact-page-settings.service";

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

export async function getContactPageSettingsHandler() {
  try {
    await requirePermission("contact-page-settings", "view");
    const settings = await getContactPageSettings();

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateContactPageSettingsHandler(request: NextRequest) {
  try {
    await requirePermission("contact-page-settings", "update");
    const body = await request.json();
    const data = updateContactPageSettingsSchema.parse(body);
    const settings = await updateContactPageSettings(data);

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return handleError(error);
  }
}
