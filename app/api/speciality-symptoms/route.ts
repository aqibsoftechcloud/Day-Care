import { NextRequest } from "next/server";
import {
  createSpecialitySymptomHandler,
  listSpecialitySymptomsHandler,
} from "@/controllers/speciality-symptom.controller";

export async function GET(request: NextRequest) {
  return listSpecialitySymptomsHandler(request);
}

export async function POST(request: NextRequest) {
  return createSpecialitySymptomHandler(request);
}
