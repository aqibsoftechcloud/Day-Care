import { NextRequest } from "next/server";
import {
  deleteTreatmentFaqHandler,
  getTreatmentFaqHandler,
  updateTreatmentFaqHandler,
} from "@/controllers/treatment-faq.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getTreatmentFaqHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateTreatmentFaqHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteTreatmentFaqHandler(resolvedParams);
}
