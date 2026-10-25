import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import { AIConfigEncryptionKeyMissingError } from "@/lib/ai/encryption";
import { AIProviderRequestError } from "@/lib/ai/providers/types";
import { generateContentSchema } from "@/validators/ai-generation.validator";
import {
  ActiveAIConfigurationMissingApiKeyError,
  NoActiveAIConfigurationError,
} from "@/services/ai.service";
import {
  AIGenerationResultInvalidError,
  generateSpecialityContent,
} from "@/services/ai-generation.service";

function handleError(error: unknown) {
  const authResponse = tryHandleAuthorizationError(error);
  if (authResponse) {
    return authResponse;
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: "Validation failed",
        errors: error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  if (
    error instanceof NoActiveAIConfigurationError ||
    error instanceof ActiveAIConfigurationMissingApiKeyError
  ) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 409 }
    );
  }

  if (
    error instanceof AIProviderRequestError ||
    error instanceof AIGenerationResultInvalidError
  ) {
    // The provider call itself is fine as an operation but the specific
    // attempt failed (rate limit, timeout, blocked content, malformed
    // output, ...) — 502 Bad Gateway: our server is fine, the upstream
    // provider's response wasn't usable. Message is already a safe,
    // hand-built string (see AIProviderRequestError/AIGenerationResultInvalidError).
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 502 }
    );
  }

  if (error instanceof AIConfigEncryptionKeyMissingError) {
    console.error("AI_CONFIG_ENCRYPTION_KEY is not configured");
    return NextResponse.json(
      { success: false, message: "AI configuration encryption is not set up on the server" },
      { status: 500 }
    );
  }

  console.error(error);

  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 }
  );
}

export async function generateContentHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const data = generateContentSchema.parse(body);

    // Permission is derived from what's actually being generated for —
    // today that's only "speciality", gated by the same specialities.update
    // permission that already controls editing a speciality's content
    // fields by hand. No new permission slug exists or is invented here.
    if (data.entity_type === "speciality") {
      await requirePermission("specialities", "update");
      const content = await generateSpecialityContent(data);
      return NextResponse.json({ success: true, content });
    }

    // Unreachable while entity_type is a single literal — kept as an
    // explicit guard rather than a silent fallthrough, so adding a second
    // entity type later is forced to add its own permission check here too.
    const exhaustiveCheck: never = data.entity_type;
    throw new Error(`Unhandled entity_type: ${String(exhaustiveCheck)}`);
  } catch (error) {
    return handleError(error);
  }
}
