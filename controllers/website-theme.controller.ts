import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requirePermission, tryHandleAuthorizationError } from "@/lib/auth/authorization";
import { updateWebsiteThemeSchema } from "@/validators/website-theme.validator";
import { getWebsiteTheme, resetWebsiteTheme, updateWebsiteTheme } from "@/services/website-theme.service";

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

export async function getWebsiteThemeHandler() {
  try {
    await requirePermission("website-appearance", "view");
    const tokens = await getWebsiteTheme();

    return NextResponse.json({ success: true, tokens });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateWebsiteThemeHandler(request: NextRequest) {
  try {
    await requirePermission("website-appearance", "update");
    const body = await request.json();
    const data = updateWebsiteThemeSchema.parse(body);
    const tokens = await updateWebsiteTheme(data);

    return NextResponse.json({ success: true, tokens });
  } catch (error) {
    return handleError(error);
  }
}

export async function resetWebsiteThemeHandler() {
  try {
    await requirePermission("website-appearance", "update");
    const tokens = await resetWebsiteTheme();

    return NextResponse.json({ success: true, tokens });
  } catch (error) {
    return handleError(error);
  }
}
