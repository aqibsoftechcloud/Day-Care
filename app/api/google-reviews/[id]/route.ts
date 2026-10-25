import { NextRequest } from "next/server";
import {
  deleteGoogleReviewHandler,
  getGoogleReviewHandler,
  updateGoogleReviewHandler,
} from "@/controllers/google-review.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getGoogleReviewHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateGoogleReviewHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteGoogleReviewHandler(resolvedParams);
}
