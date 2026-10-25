import { NextRequest } from "next/server";
import { activateAIConfigurationHandler } from "@/controllers/ai-configuration.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return activateAIConfigurationHandler(resolvedParams);
}
