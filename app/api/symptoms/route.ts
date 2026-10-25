import { NextRequest } from "next/server";
import {
  createSymptomHandler,
  listSymptomsHandler,
} from "@/controllers/symptom.controller";

export async function GET(request: NextRequest) {
  return listSymptomsHandler(request);
}

export async function POST(request: NextRequest) {
  return createSymptomHandler(request);
}
