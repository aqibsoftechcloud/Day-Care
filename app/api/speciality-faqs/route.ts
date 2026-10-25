import { NextRequest } from "next/server";
import {
  createSpecialityFaqHandler,
  listSpecialityFaqsHandler,
} from "@/controllers/speciality-faq.controller";

export async function GET(request: NextRequest) {
  return listSpecialityFaqsHandler(request);
}

export async function POST(request: NextRequest) {
  return createSpecialityFaqHandler(request);
}
