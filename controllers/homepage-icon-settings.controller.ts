import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requirePermission, tryHandleAuthorizationError } from "@/lib/auth/authorization";
import {
  cityIdParamSchema,
  updateCityHomepageIconOverridesSchema,
  updateGlobalHomepageIconsSchema,
} from "@/validators/homepage-icon-settings.validator";
import {
  CityNotFoundError,
  getCityHomepageIconOverrides,
  getGlobalHomepageIcons,
  resetCityHomepageIconOverrides,
  resetGlobalHomepageIcons,
  updateCityHomepageIconOverrides,
  updateGlobalHomepageIcons,
} from "@/services/homepage-icon-settings.service";

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

  if (error instanceof CityNotFoundError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 404 });
  }

  console.error(error);

  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

export async function getGlobalHomepageIconsHandler() {
  try {
    await requirePermission("homepage-icons", "view");
    const icons = await getGlobalHomepageIcons();

    return NextResponse.json({ success: true, icons });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateGlobalHomepageIconsHandler(request: NextRequest) {
  try {
    await requirePermission("homepage-icons", "update");
    const body = await request.json();
    const data = updateGlobalHomepageIconsSchema.parse(body);
    const icons = await updateGlobalHomepageIcons(data);

    return NextResponse.json({ success: true, icons });
  } catch (error) {
    return handleError(error);
  }
}

export async function resetGlobalHomepageIconsHandler() {
  try {
    await requirePermission("homepage-icons", "update");
    const icons = await resetGlobalHomepageIcons();

    return NextResponse.json({ success: true, icons });
  } catch (error) {
    return handleError(error);
  }
}

export async function getCityHomepageIconOverridesHandler(params: { cityId: string }) {
  try {
    await requirePermission("homepage-icons", "view");
    const { cityId } = cityIdParamSchema.parse(params);
    const [global, overrides] = await Promise.all([
      getGlobalHomepageIcons(),
      getCityHomepageIconOverrides(cityId),
    ]);

    return NextResponse.json({ success: true, global, overrides });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateCityHomepageIconOverridesHandler(request: NextRequest, params: { cityId: string }) {
  try {
    await requirePermission("homepage-icons", "update");
    const { cityId } = cityIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateCityHomepageIconOverridesSchema.parse(body);
    const overrides = await updateCityHomepageIconOverrides(cityId, data);

    return NextResponse.json({ success: true, overrides });
  } catch (error) {
    return handleError(error);
  }
}

export async function resetCityHomepageIconOverridesHandler(params: { cityId: string }) {
  try {
    await requirePermission("homepage-icons", "update");
    const { cityId } = cityIdParamSchema.parse(params);
    const overrides = await resetCityHomepageIconOverrides(cityId);

    return NextResponse.json({ success: true, overrides });
  } catch (error) {
    return handleError(error);
  }
}
