import { NextRequest } from "next/server";
import {
  createGlobalTreatmentHandler,
  listGlobalTreatmentsHandler,
} from "@/controllers/global-treatment.controller";

export async function GET(request: NextRequest) {
  return listGlobalTreatmentsHandler(request);
}

export async function POST(request: NextRequest) {
  return createGlobalTreatmentHandler(request);
}
