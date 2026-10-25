import { NextRequest } from "next/server";
import {
  createGoogleReviewHandler,
  listGoogleReviewsHandler,
} from "@/controllers/google-review.controller";

export async function GET(request: NextRequest) {
  return listGoogleReviewsHandler(request);
}

export async function POST(request: NextRequest) {
  return createGoogleReviewHandler(request);
}
