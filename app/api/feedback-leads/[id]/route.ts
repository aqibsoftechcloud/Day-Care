import { NextRequest } from "next/server";
import {
  deleteFeedbackLeadHandler,
  getFeedbackLeadHandler,
  updateFeedbackLeadHandler,
} from "@/controllers/feedback-lead.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getFeedbackLeadHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateFeedbackLeadHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteFeedbackLeadHandler(resolvedParams);
}
