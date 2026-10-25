import { NextRequest } from "next/server";
import {
  createTreatmentSymptomHandler,
  listTreatmentSymptomsHandler,
} from "@/controllers/treatment-symptom.controller";

export async function GET(request: NextRequest) {
  return listTreatmentSymptomsHandler(request);
}

export async function POST(request: NextRequest) {
  return createTreatmentSymptomHandler(request);
}
