import { NextRequest } from "next/server";
import {
  createSymptomPartHandler,
  listSymptomPartsHandler,
} from "@/controllers/symptom-part.controller";

export async function GET(request: NextRequest) {
  return listSymptomPartsHandler(request);
}

export async function POST(request: NextRequest) {
  return createSymptomPartHandler(request);
}
