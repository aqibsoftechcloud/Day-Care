import { NextRequest } from "next/server";
import {
  createTreatmentFaqHandler,
  listTreatmentFaqsHandler,
} from "@/controllers/treatment-faq.controller";

export async function GET(request: NextRequest) {
  return listTreatmentFaqsHandler(request);
}

export async function POST(request: NextRequest) {
  return createTreatmentFaqHandler(request);
}
