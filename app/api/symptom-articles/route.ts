import { NextRequest } from "next/server";
import {
  createSymptomArticleHandler,
  listSymptomArticlesHandler,
} from "@/controllers/symptom-article.controller";

export async function GET(request: NextRequest) {
  return listSymptomArticlesHandler(request);
}

export async function POST(request: NextRequest) {
  return createSymptomArticleHandler(request);
}
