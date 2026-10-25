import { NextRequest } from "next/server";
import {
  deleteSymptomArticleHandler,
  getSymptomArticleHandler,
  updateSymptomArticleHandler,
} from "@/controllers/symptom-article.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getSymptomArticleHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateSymptomArticleHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteSymptomArticleHandler(resolvedParams);
}
