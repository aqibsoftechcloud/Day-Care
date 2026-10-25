import { NextRequest } from "next/server";
import {
  deleteGeneralFaqHandler,
  getGeneralFaqHandler,
  updateGeneralFaqHandler,
} from "@/controllers/general-faq.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getGeneralFaqHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateGeneralFaqHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteGeneralFaqHandler(resolvedParams);
}
