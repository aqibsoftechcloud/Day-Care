import { NextRequest } from "next/server";
import {
  deleteBannerHandler,
  getBannerHandler,
  updateBannerHandler,
} from "@/controllers/banner.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getBannerHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateBannerHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteBannerHandler(resolvedParams);
}
