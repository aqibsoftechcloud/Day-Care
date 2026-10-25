import { NextRequest } from "next/server";
import {
  deleteAIConfigurationHandler,
  getAIConfigurationHandler,
  updateAIConfigurationHandler,
} from "@/controllers/ai-configuration.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getAIConfigurationHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateAIConfigurationHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteAIConfigurationHandler(resolvedParams);
}
