import { NextRequest } from "next/server";
import {
  deleteActionHandler,
  getActionHandler,
  updateActionHandler,
} from "@/controllers/action.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getActionHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateActionHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteActionHandler(resolvedParams);
}
