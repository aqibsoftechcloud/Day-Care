import { NextRequest } from "next/server";
import { listFeedbackLeadsHandler } from "@/controllers/feedback-lead.controller";

export async function GET(request: NextRequest) {
  return listFeedbackLeadsHandler(request);
}
