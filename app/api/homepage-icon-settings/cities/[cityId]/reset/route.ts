import { resetCityHomepageIconOverridesHandler } from "@/controllers/homepage-icon-settings.controller";

type RouteParams = { params: Promise<{ cityId: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const resolvedParams = await params;
  return resetCityHomepageIconOverridesHandler(resolvedParams);
}
