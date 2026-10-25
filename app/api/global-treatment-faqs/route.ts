import { NextRequest } from "next/server";
import {
  createGlobalTreatmentFaqHandler,
  listGlobalTreatmentFaqsHandler,
} from "@/controllers/global-treatment-faq.controller";

export async function GET(request: NextRequest) {
  return listGlobalTreatmentFaqsHandler(request);
}

export async function POST(request: NextRequest) {
  return createGlobalTreatmentFaqHandler(request);
}
