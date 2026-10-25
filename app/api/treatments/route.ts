import { NextRequest } from "next/server";
import {
  createTreatmentHandler,
  listTreatmentsHandler,
} from "@/controllers/treatment.controller";

export async function GET(request: NextRequest) {
  return listTreatmentsHandler(request);
}

export async function POST(request: NextRequest) {
  return createTreatmentHandler(request);
}
