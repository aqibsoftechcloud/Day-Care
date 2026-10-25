import { NextRequest } from "next/server";
import {
  getCityHomepageIconOverridesHandler,
  updateCityHomepageIconOverridesHandler,
} from "@/controllers/homepage-icon-settings.controller";

type RouteParams = { params: Promise<{ cityId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getCityHomepageIconOverridesHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateCityHomepageIconOverridesHandler(request, resolvedParams);
}
