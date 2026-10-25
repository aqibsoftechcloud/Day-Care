import { NextRequest } from "next/server";
import {
  createGlobalSpecialityFaqHandler,
  listGlobalSpecialityFaqsHandler,
} from "@/controllers/global-speciality-faq.controller";

export async function GET(request: NextRequest) {
  return listGlobalSpecialityFaqsHandler(request);
}

export async function POST(request: NextRequest) {
  return createGlobalSpecialityFaqHandler(request);
}
