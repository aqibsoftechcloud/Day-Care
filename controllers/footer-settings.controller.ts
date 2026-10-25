import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requirePermission, tryHandleAuthorizationError } from "@/lib/auth/authorization";
import { MulterError, parseMultipartFields, UnsupportedFileTypeError } from "@/lib/upload";
import { updateFooterSettingsSchema } from "@/validators/footer-settings.validator";
import { getFooterSettings, updateFooterSettings, type FooterLogoInput } from "@/services/footer-settings.service";

const FOOTER_UPLOAD_FIELDS = [{ name: "logo", maxCount: 1 }];

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

  if (error instanceof UnsupportedFileTypeError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }

  if (error instanceof MulterError) {
    return NextResponse.json({ success: false, message: `Upload error: ${error.message}` }, { status: 400 });
  }

  console.error(error);

  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

export async function getFooterSettingsHandler() {
  try {
    await requirePermission("footer-settings", "view");
    const settings = await getFooterSettings();

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Multipart, like every other endpoint with an optional image: the settings
 * are one JSON string in the `settings` field, the logo is a real file in
 * `logo`, and a `logo` text field sent as "" is the explicit "remove it"
 * signal (multipart has no native null). Neither -> the stored logo is kept.
 */
export async function updateFooterSettingsHandler(request: NextRequest) {
  try {
    await requirePermission("footer-settings", "update");
    const { fields, files } = await parseMultipartFields(request, FOOTER_UPLOAD_FIELDS);

    let raw: unknown;
    try {
      raw = JSON.parse(fields.settings ?? "");
    } catch {
      return NextResponse.json({ success: false, message: "Validation failed", errors: { settings: ["Settings must be valid JSON"] } }, { status: 400 });
    }

    const data = updateFooterSettingsSchema.parse(raw);

    const file = files.logo?.[0];
    const logo: FooterLogoInput | null | undefined = file
      ? { buffer: file.buffer, mimeType: file.mimetype }
      : fields.logo === ""
        ? null
        : undefined;

    const settings = await updateFooterSettings(data, logo);

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return handleError(error);
  }
}
