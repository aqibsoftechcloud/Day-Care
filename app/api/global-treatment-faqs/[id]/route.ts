import { NextRequest } from "next/server";
import {
  deleteGlobalTreatmentFaqHandler,
  getGlobalTreatmentFaqHandler,
  updateGlobalTreatmentFaqHandler,
} from "@/controllers/global-treatment-faq.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getGlobalTreatmentFaqHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateGlobalTreatmentFaqHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteGlobalTreatmentFaqHandler(resolvedParams);
}
